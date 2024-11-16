import { config } from "dotenv";
import { cleanEnv, str, num, url } from "envalid";

config({ path: ".env" }); // Read in environment variables from `.env` if it exists

const validateEnv = cleanEnv(process.env, {
    /**
     * A comma-separated list of group names to ignore
     */
    BLACK_LIST: str({ default: "students,student,teams,teams_assignment-iii,infra-test" }),
    /**
     * The maximum number of subgroups a group can have before it is skipped
     */
    HARD_LIMIT: num({ default: 50 }),
    /**
     * The directory to store backups in
     */
    BACKUP_DIR: str({ default: "./backup" }),
    /**
     * The GitLab host
     */
    GITLAB_HOST: url(),
    /**
     * The GitLab API token
     */
    GITLAB_TOKEN: str(),
    /**
     * The parent group to start querying from. Could be id or name (string)
     */
    GROUP_PARENT: str(),
    /**
     * Run specifically a part
     */
    RUN_PART: str({ default: "ALL", choices: ["QUERY", "CLONE", "UPDATE", "ALL", "BATCH_UPDATE"] }),
});

export default validateEnv;
