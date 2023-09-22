import logger from "@util/logger";
import { FileOutput, removeLastSlashAndText } from "@util/util";
import validateEnv from "@util/validateEnv";
import { readFileSync } from "fs";
import { exec } from "node:child_process";

if (typeof require !== "undefined" && require.main === module) {
    main();
}

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

    for (const folder of folders) {
        try {
            await createFolder(`${validateEnv.BACKUP_DIR}/${folder}`);
            logger.verbose(`Created folder at ${validateEnv.BACKUP_DIR}/${folder}`);
        } catch (err) {
            logger.error(`Failed to create folder at ${validateEnv.BACKUP_DIR}/${folder}`);
            logger.error(err);
            logger.error(JSON.stringify(err));
        }
    }

    for (const repo of Object.values(input)) {
        const fullPath = `${validateEnv.BACKUP_DIR}/${repo.path_with_namespace}`;
        if (await checkAlreadyCloned(fullPath)) {
            logger.info(`${repo.path_with_namespace} already cloned`);
        } else {
            logger.info(`Cloning ${repo.path_with_namespace}`);
            try {
                await createClonePromise(repo.http_url_to_repo, fullPath);
            } catch (err) {
                logger.error(`Failed to clone ${repo.path_with_namespace}`);
                logger.error(err);
            }
        }
    }
}

/**
 * Create a folder at `path`. Does not throw errors if the folder already exists
 * @param path
 */
async function createFolder(path: string): Promise<void> {
    try {
        await exec(`mkdir -p ${path}`);
    } catch (err) {
        throw new Error(`Failed to create folder at ${path}`);
    }
}

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
