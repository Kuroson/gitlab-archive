import logger from "@util/logger";
import { FileOutput, removeLastSlashAndText } from "@util/util";
import validateEnv from "@util/validateEnv";
import { readFileSync } from "fs";
import { exec } from "node:child_process";

if (typeof require !== "undefined" && require.main === module) {
    main();
}

/**
 * Clone all repos in `./backup/table.json`
 */
export async function main(): Promise<void> {
    const input = JSON.parse(readFileSync(`${validateEnv.BACKUP_DIR}/table.json`, "utf-8")) as FileOutput;

    logger.info(`Retrieved ${Object.keys(input).length} projects`);

    const folders = Array.from(
        new Set(
            Object.values(input)
                .map((x) => removeLastSlashAndText(x.path_with_namespace))
                .filter((x) => x.length !== 0),
        ),
    );

    logger.info(`Creating ${folders.length} folders`);
    let index = 0;
    for (const folder of folders) {
        try {
            await createFolder(`${validateEnv.BACKUP_DIR}/${folder}`);
            logger.verbose(
                `[${String(index + 1).padStart(folders.length.toString().length, "0")}/${
                    folders.length
                }] Created folder at ${validateEnv.BACKUP_DIR}/${folder}`,
            );
        } catch (err) {
            logger.error(
                `[${String(index + 1).padStart(folders.length.toString().length, "0")}/${
                    folders.length
                }] Failed to create folder at ${validateEnv.BACKUP_DIR}/${folder}`,
            );
            logger.error(err);
            logger.error(JSON.stringify(err));
        }
        index += 1;
    }

    let index2 = 0;
    const repos = Object.values(input);
    for (const repo of repos) {
        const fullPath = `${validateEnv.BACKUP_DIR}/${repo.path_with_namespace}`;
        if (await checkAlreadyCloned(fullPath)) {
            logger.info(
                `[${String(index2 + 1).padStart(repos.length.toString().length, "0")}/${repos.length}] ${
                    repo.path_with_namespace
                } already cloned`,
            );
        } else {
            logger.info(
                `[${String(index2 + 1).padStart(repos.length.toString().length, "0")}/${repos.length}] Cloning ${
                    repo.path_with_namespace
                }`,
            );
            try {
                await createClonePromise(repo.http_url_to_repo, fullPath);
            } catch (err) {
                logger.error(
                    `[${String(index2 + 1).padStart(repos.length.toString().length, "0")}/${
                        repos.length
                    }] Failed to clone ${repo.path_with_namespace}`,
                );
                logger.error(err);
            }
        }
        index2 += 1;
    }
}

/**
 * Create a folder at `path`. Does not throw errors if the folder already exists
 * @param path
 */
async function createFolder(path: string): Promise<void> {
    try {
        exec(`mkdir -p ${path}`);
        await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
        throw new Error(`Failed to create folder at ${path}, ${JSON.stringify(err)}`);
    }
}

/**
 * Clone a repo to `destPath`
 * @param https_clone https remote url to clone
 * @param destPath destination path
 * @returns
 */
function createClonePromise(https_clone: string, destPath): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const command = `git clone ${https_clone}`.replace("https://", `https://oauth2:${validateEnv.GITLAB_TOKEN}@`);
        exec(`${command} ${destPath}`, (err, stdout, stderr) => {
            if (err) {
                reject(stderr);
            }
            resolve(stdout);
        });
    });
}

/**
 * Checks if the repo at `destPath` has already been cloned
 * @param destPath
 * @returns
 */
function checkAlreadyCloned(destPath: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        exec(`cd ${destPath} && git remote -v`, (err, stdout, stderr) => {
            if (err) {
                resolve(false);
            }
            resolve(stdout.includes("origin"));
        });
    });
}
