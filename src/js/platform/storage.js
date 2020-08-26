/* typehints:start */
import { Application } from "../application";
/* typehints:end */

export const FILE_NOT_FOUND = "file_not_found";

export class StorageInterface {
    constructor(app) {
        /** @type {Application} */
        this.app = app;
    }

    /**
     * Initializes the storage
     * @returns {Promise<void>}
     */
    initialize() {
        abstract;
        return Promise.reject();
    }

    /**
     * Writes a string to a file asynchronously
     * @param {string} filename
     * @param {string|ArrayBuffer} contents
     * @param {string[]=} path
     * @returns {Promise<void>}
     */
    writeFileAsync(filename, contents, path = []) {
        abstract;
        return Promise.reject();
    }

    /**
     * Tries to write a file synchronously, used in unload handler
     * @param {string} filename
     * @param {string|ArrayBuffer} contents
     * @param {string[]=} path
     */
    writeFileSyncIfSupported(filename, contents, path = []) {
        abstract;
        return false;
    }

    /**
     * Reads a string asynchronously. Returns Promise<FILE_NOT_FOUND> if file was not found.
     * @param {string} filename
     * @param {string[]=} path
     * @returns {Promise<string>}
     */
    readFileAsync(filename, path = []) {
        abstract;
        return Promise.reject();
    }

    /**
     * Tries to delete a file
     * @param {string} filename
     * @param {string[]=} path
     * @returns {Promise<void>}
     */
    deleteFileAsync(filename, path = []) {
        // Default implementation does not allow deleting files
        return Promise.reject();
    }

    /**
     * Reveals a file in file manager
     * @param {string} filename
     * @param {string[]=} path
     * @returns {Promise<void>}
     */
    revealFileAsync(filename, path = []) {
        // Default implementation does not allow revealing files
        return Promise.reject();
    }
}
