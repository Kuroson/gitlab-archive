import { main as updateMain } from "./update";
import { main as updateMainBatch } from "./batchUpdate";
import { main as updateClone } from "./clone";
import { main as updateQuery } from "./query";
import validateEnv from "@util/validateEnv";

if (typeof require !== "undefined" && require.main === module) {
    main();
}

async function main(): Promise<void> {
    if (validateEnv.RUN_PART === "ALL") {
        await updateQuery();
        await updateClone();
        await updateMain();
    } else if (validateEnv.RUN_PART === "QUERY") {
        await updateQuery();
    } else if (validateEnv.RUN_PART === "CLONE") {
        await updateClone();
    } else if (validateEnv.RUN_PART === "UPDATE") {
        await updateMain();
    } else if (validateEnv.RUN_PART === "BATCH_UPDATE") {
        await updateMainBatch();
    }
}
