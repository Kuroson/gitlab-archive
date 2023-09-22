import { main as updateMain } from "./update";
import { main as updateClone } from "./clone";
import { main as updateQuery } from "./query";

if (typeof require !== "undefined" && require.main === module) {
    main();
}

async function main(): Promise<void> {
    await updateQuery();
    await updateClone();
    await updateMain();
}
