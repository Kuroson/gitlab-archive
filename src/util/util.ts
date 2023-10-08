import { ExpandedGroupSchema, Gitlab as GitlabCore, GroupSchema } from "@gitbeaker/core";
import validateEnv from "./validateEnv";
import logger from "./logger";
import Stack from "./Stack";

const BLACK_LIST = validateEnv.BLACK_LIST.split(",").map((x) => x.toLowerCase());

/**
 * Simplified data representation of queried GitLab data
 */
export type ProjectInfo = {
    id: string;
    name: string;
    path_with_namespace: string;
    ssh_url_to_repo: string;
    http_url_to_repo: string;
    web_url: string;
};

/**
 * Get all projects in a group recursively
 * @param api
 * @param initialGroup initial group as an id or name (string)
 * @returns tuple of [projects, error]
 */
export const getAllProjects = async (
    api: GitlabCore<false>,
    initialGroup: { path: string; id: number },
): Promise<[ProjectInfo[], null] | [null, Error | unknown]> => {
    const stack = new Stack<{ path: string; id: number }>();
    stack.push(initialGroup);
    const allProjects: ProjectInfo[] = [];

    while (!stack.isEmpty()) {
        const currentGroup = stack.pop();
        if (currentGroup === undefined) continue;
        logger.verbose(`Processing ${currentGroup.path} (${currentGroup.id})`);
        // Query subgroups of current groupID
        const [groups, groupsErr] = await querySubgroups(api, currentGroup.id);

        if (groupsErr !== null || groups === null) {
            logger.error(`Failed to query subgroups of ${currentGroup.path} (${currentGroup.id})`);
        } else {
            const groupsParsed = groups
                .map((x) => {
                    return { id: x.id, path: x.path, full_path: x.full_path };
                })
                .filter((x) => !BLACK_LIST.includes(x.path.toLowerCase()));
            if (groupsParsed.length >= validateEnv.HARD_LIMIT) {
                logger.error(
                    `Group ${currentGroup.path} (${currentGroup.id}) has ${groupsParsed.length} subgroups which broke the hard limit of ${validateEnv.HARD_LIMIT}. Skipping...`,
                );
            } else {
                // Push all subgroups to stack
                groupsParsed.forEach((x) => stack.push({ id: x.id, path: x.full_path }));
            }
        }

        // Get the projects of the current group
        const [projects, projectsErr] = await queryProjects(api, currentGroup.id);
        if (projectsErr !== null || projects === null) {
            logger.error(`Failed to query projects of ${currentGroup.path} (${currentGroup.id})`);
            logger.error(projectsErr);
            logger.error(JSON.stringify(projectsErr));
            continue;
        }
        allProjects.push(...projects);
    }
    return [allProjects, null];
};

/**
 * Query all subgroups of a group
 * @param api
 * @param parentGroupName parent group as an id or name (string)
 * @returns tuple of [subgroups, error]
 */
export const querySubgroups = async (
    api: GitlabCore<false>,
    parentGroupName: string | number,
): Promise<[GroupSchema[], null] | [null, Error | unknown]> => {
    try {
        const groups = await api.Groups.allSubgroups(parentGroupName);
        return [groups, null];
    } catch (err) {
        return [null, err];
    }
};

/**
 * Query all projects of a group
 * @param api
 * @param groupID group id
 * @returns tuple of [projects, error]
 */
export const queryProjects = async (
    api: GitlabCore<false>,
    groupID: string | number,
): Promise<[ProjectInfo[], null] | [null, Error | unknown]> => {
    try {
        const projects = await api.Groups.allProjects(groupID, { showExpanded: false, simple: true });
        const parsedProjects: ProjectInfo[] = projects.map((x) => {
            return {
                id: x.id,
                name: x.name,
                path_with_namespace: x.path_with_namespace,
                ssh_url_to_repo: x.ssh_url_to_repo,
                http_url_to_repo: x.http_url_to_repo,
                web_url: x.web_url,
            } as unknown as ProjectInfo; // hacky
        });
        return [parsedProjects, null];
    } catch (err) {
        return [null, err];
    }
};

export type FileOutput = Record<number, ProjectInfo>;

/**
 * Removes the last "/" and text after it or the original string if none
 * @param inputString
 * @returns
 */
export const removeLastSlashAndText = (inputString: string): string => {
    const lastIndex = inputString.lastIndexOf("/");

    if (lastIndex !== -1) {
        // Remove the last "/" and text after it
        return inputString.substring(0, lastIndex);
    } else {
        // If there's no "/" in the string, return the original string
        return inputString;
    }
};

/**
 * Get the group info of a group
 * @param api
 * @param id group id or name (string)
 * @returns tuple of [groupInfo, error]
 */
export const getGroupInfo = async (
    api: GitlabCore<false>,
    id: string | number,
): Promise<[ExpandedGroupSchema, null] | [null, Error | unknown]> => {
    try {
        const projectInfo = await api.Groups.show(id, { showExpanded: false, simple: true });
        return [projectInfo, null];
    } catch (err) {
        return [null, err];
    }
};
