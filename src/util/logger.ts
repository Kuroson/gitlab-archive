import moment from "moment-timezone";
import winston, { format } from "winston";

const logger = winston.createLogger({
    format: format.combine(
        format.timestamp({
            format: moment().tz("Australia/Sydney").format("YYYY-MM-DD HH:mm:ss").toString(),
        }),
        format.printf(
            (info) =>
                `${info.timestamp} ${info.level}: ${info.message}` + (info.splat !== undefined ? `${info.splat}` : ""),
        ),
    ),
    transports: [
        new winston.transports.Console({
            level: "debug",
            format: format.combine(
                format.colorize(),
                format.timestamp({
                    format: moment().tz("Australia/Sydney").format("YYYY-MM-DD HH:mm:ss").toString(),
                }),
                format.simple(),
                format.printf(
                    (info) =>
                        `${info.timestamp} ${info.level}: ${info.message}` +
                        (info.splat !== undefined ? `${info.splat}` : ""),
                ),
            ),
        }),
        new winston.transports.File({
            level: "verbose",
            filename: "logs/logs.log",
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
});

export default logger;
