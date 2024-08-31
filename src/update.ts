import logger from "@util/logger";
import { FileOutput } from "@util/util";
import validateEnv from "@util/validateEnv";
import { readFileSync } from "fs";
import { exec } from "node:child_process";

if (typeof require !== "undefined" && require.main === module) {
    main();
}

/**
 * Update all repos in `./backup/table.json`
 */
export async function main(): Promise<void> {
    const input = JSON.parse(readFileSync(`${validateEnv.BACKUP_DIR}/table.json`, "utf-8")) as FileOutput;
    const repos = Object.values(input);

    let index = 0;
    for (const repo of repos) {
        logger.info(
            `[${String(index + 1).padStart(repos.length.toString().length, "0")}/${repos.length}] Updating ${
                repo.path_with_namespace
            }`,
        );
        try {
            await gitFetch(`${validateEnv.BACKUP_DIR}/${repo.path_with_namespace}`);
        } catch (err) {
            logger.error(
                `[${String(index + 1).padStart(repos.length.toString().length, "0")}/${repos.length}] Failed to fetch ${
                    repo.path_with_namespace
                }`,
            );
            logger.error(err);
        }

        try {
            await resetMaster(`${validateEnv.BACKUP_DIR}/${repo.path_with_namespace}`);
        } catch (err) {
            logger.error(
                `[${String(index + 1).padStart(repos.length.toString().length, "0")}/${repos.length}] Failed to reset ${
                    repo.path_with_namespace
                }`,
            );
            logger.error(err);
        }
        await checkoutAllBranches(`${validateEnv.BACKUP_DIR}/${repo.path_with_namespace}`);
        index += 1;
    }
}

/**
 * Fetch all changes from remote
 * @param destPath
 * @returns
 */
function gitFetch(destPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        exec(`cd ${destPath} && git fetch --all`, (err, stdout, stderr) => {
            if (stderr.trim().length !== 0) {
                logger.verbose(stderr.trim());
            }
            if (stdout.length !== 0) {
                logger.verbose(stdout.trim());
            }
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

/**
 * Reset branch to default (main or master)
 * @param destPath
 * @returns
 */
function resetMaster(destPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        exec(
            `cd ${destPath} && sh -c 'current_branch="$(git symbolic-ref --short HEAD)"; if [ "$current_branch" = "master" ]; then git reset --hard origin/master; elif [ "$current_branch" = "main" ]; then git reset --hard origin/main; else echo "Unsupported branch: $current_branch"; fi'            `,
            (err, stdout, stderr) => {
                if (stderr.trim().length !== 0) {
                    logger.verbose(stderr.trim());
                }
                if (stdout.length !== 0) {
                    logger.verbose(stdout.trim());
                }
                if (err) {
                    reject(err);
                }
                resolve();
            },
        );
    });
}

/**
 * Attempt to checkout all branches
 * @param destPath
 * @returns
 */
function checkoutAllBranches(destPath: string): Promise<void> {
    const command = "for b in `git branch -r | grep -v -- '->'`; do git branch --track ${b##origin/} $b; done";
    return new Promise<void>((resolve, reject) => {
        exec(`cd ${destPath} && ${command}`, (err, stdout, stderr) => {
            if (stderr.trim().length !== 0) {
                logger.verbose(stderr.trim());
            }
            if (stdout.length !== 0) {
                logger.verbose(stdout.trim());
            }
            resolve();
        });
    });
}
