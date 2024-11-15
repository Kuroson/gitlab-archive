import moment from "moment-timezone";
import winston, { format } from "winston";

const logger = winston.createLogger({
    format: format.combine(
        format.timestamp({
            format: () => {
                return moment()
                    .tz("Australia/Sydney")
                    .format(process.env.GITLAB_CI === "true" ? "hh:mm:ss A" : "YYYY-MM-DD hh:mm:ss A")
                    .toString();
            },
        }),
        format.json(),
        format.printf(
            (info) =>
                `[ ${info.timestamp} ] ${info.level}: ${info.message}` +
                (info.splat !== undefined ? `${info.splat}` : ""),
        ),
    ),
    transports: [
        new winston.transports.Console({
            level: "debug",
            format: format.combine(
                process.env.WINSTON_COLOUR !== "false" ? format.colorize() : format.simple(),
                format.timestamp({
                    format: () => {
                        return moment()
                            .tz("Australia/Sydney")
                            .format(process.env.GITLAB_CI === "true" ? "hh:mm:ss A" : "YYYY-MM-DD hh:mm:ss A")
                            .toString();
                    },
                }),
                format.json(),
                format.simple(),
                format.printf(
                    (info) =>
                        `[ ${info.timestamp} ] ${info.level}: ${info.message}` +
                        (info.splat !== undefined ? `${info.splat}` : ""),
                ),
            ),
        }),
        new winston.transports.File({
            level: "verbose",
            filename: `logs/${process.env.LOG_FILE_NAME ?? "logs.log"}`,
            maxsize: 5242880, // Maximum log file size in bytes (5MB in this case)
            maxFiles: 20, // Number of log files to keep
            tailable: true, // Append to the same file instead of overwriting
        }),
    ],
});

winston.addColors({
    error: "red",
    warn: "yellow",
    info: "cyan",
    debug: "green",
    verbose: "green",
});

export default logger;
