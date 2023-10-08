import { Gitlab } from "@gitbeaker/rest";
import logger from "@util/logger";
import { FileOutput, ProjectInfo, getAllProjects, getGroupInfo, querySubgroups } from "@util/util";
import validateEnv from "@util/validateEnv";
import { writeFileSync } from "fs";

if (typeof require !== "undefined" && require.main === module) {
    main();
}

/**
 * Query all projects recursively and write (or overwrite) to `./backup/table.json`
 */
export async function main(): Promise<void> {
    logger.info("Establishing connection to GitLab");
    const api = new Gitlab({
        host: validateEnv.GITLAB_HOST,
        token: validateEnv.GITLAB_TOKEN,
    });

    const parentGroup = validateEnv.GROUP_PARENT;
    const [parentGroupInfo, parentGroupInfoErr] = await getGroupInfo(api, parentGroup);

    if (parentGroupInfo === null) {
        logger.error(`Failed to get group info of ${parentGroup}`);
        logger.error(parentGroupInfoErr);
        logger.error(JSON.stringify(parentGroupInfoErr));
        throw new Error("Failed to get group info");
    }
    logger.info(`Parent group: ${parentGroup}, id: ${parentGroupInfo.id}, path: ${parentGroupInfo.path}`);

    logger.info(`Querying subgroups of ${parentGroup}`);
    const [groups, err] = await querySubgroups(api, parentGroup);

    if (err !== null) {
        logger.error(`Failed to query subgroups of parent group ${parentGroup}`);
        logger.error(err);
        logger.error(JSON.stringify(err));
    }
    if (groups === null) throw new Error("groups is null");
    logger.info(`Retrieved ${groups.length} subgroups of ${parentGroup}`);

    const parsedGroups = [
        { id: parentGroupInfo.id, path: parentGroupInfo.path },
        ...groups.map((x) => {
            return { id: x.id, path: x.path };
        }),
    ].sort((x, y) => (x.id > y.id ? 1 : -1));

    logger.verbose(`Paths: ${parsedGroups.map((x) => x.path).join(", ")}`);

    const allProjects: ProjectInfo[] = [];

    for (const g of parsedGroups) {
        logger.info(`Querying ${g.path}`);
        const [projects, projectsErr] = await getAllProjects(api, g);
        if (projectsErr !== null || projects === null) {
            logger.error(`Failed to get projects of ${g.path}`);
            logger.error(projectsErr);
            logger.error(JSON.stringify(projectsErr));
            continue;
        }
        allProjects.push(...projects);
    }
    const fileOutput: FileOutput = allProjects.reduce((acc, x) => {
        acc[x.id] = x;
        return acc;
    }, {});
    writeFileSync(`./${validateEnv.BACKUP_DIR}/table.json`, JSON.stringify(fileOutput, null, 4));
}
