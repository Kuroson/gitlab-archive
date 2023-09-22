import { config } from "dotenv";
import { cleanEnv, str, num, url } from "envalid";

config({ path: ".env" }); // Read in environment variables from `.env` if it exists

const validateEnv = cleanEnv(process.env, {
    BLACK_LIST: str({ default: "students,student,teams,teams_assignment-iii,infra-test" }),
    HARD_LIMIT: num({ default: 50 }),
    BACKUP_DIR: str({ default: "./backup" }),
    GITLAB_HOST: url(),
    GITLAB_TOKEN: str(),
    GROUP_PARENT: str(),
});

export default validateEnv;
