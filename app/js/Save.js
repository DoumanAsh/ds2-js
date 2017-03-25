"use strict";

/**
 * Represents Save file.
 */
export default class Save {
    /**
     * @constructor
     *
     * @param {String} file_name Name of save file.
     * @param {Array} buffer File content as binary buffer Uint8Array.
     */
    constructor(file_name, buffer) {
        this.name = file_name;
        this.buffer = buffer;
        this.view = new DataView(this.buffer);
    }

    /**
     * @returns {Blob} Binary blob of save.
     */
    blob() {
        return new Blob([new Uint8Array(this.buffer)], {type: "data:application/octet-stream;base64,"});
    }

    /**
     * @returns {Boolean} Whether buffer matches DS2 start bytes.
     */
    is_ds2() {
        var start_bytes = [0x44, 0x65, 0x76, 0x69];

        if (this.buffer.length < start_bytes.length) {
            return false;
        }

        for (var idx = 0; idx < start_bytes.length; idx++) {
            if (this.get_u8(idx) !== start_bytes[idx]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Writes 4 bytes integer.
     * @param {Integer} offset From where to start writing.
     * @param {Integer} value Value to set.
     * @throws When attempting to write outside of buffer.
     * @returns {void}
     */
    set_u32(offset, value) {
        return this.set_int(offset, 4, value);
    }

    /**
     * Writes 2 bytes integer.
     * @param {Integer} offset From where to start writing.
     * @param {Integer} value Value to set.
     * @throws When attempting to write outside of buffer.
     * @returns {void}
     */
    set_u16(offset, value) {
        return this.set_int(offset, 2, value);
    }

    /**
     * Writes 1 byte integer.
     * @param {Integer} offset From where to start writing.
     * @param {Integer} value Value to set.
     * @throws When attempting to write outside of buffer.
     * @returns {void}
     */
    set_u8(offset, value) {
        return this.set_int(offset, 1, value);
    }

    /**
     * Writes value into save's view as LE.
     *
     * @param {Integer} offset From where to start writing.
     * @param {Integer} num Number of bytes to write. Allowed values 1, 2, 4.
     * @param {Integer} value Value to set.
     * @throws When attempting to write outside of buffer.
     * @returns {void}
     */
    set_int(offset, num, value) {
        switch (num) {
            case 4:
                this.view.setUint32(offset, value, true);
                break;
            case 2:
                this.view.setUint16(offset, value, true);
                break;
            case 1:
                this.view.setUint8(offset, value, true);
                break;
            default:
                throw "Unsupported size=" + num + " to read from save is given.";
        }
    }

    /**
     * @returns {Integer} 4 bytes integer in LE.
     * @param {Integer} offset From where to start reading.
     * @throws When attempting to read outside of buffer.
     */
    get_u32(offset) {
        return this.get_int(offset, 4);
    }

    /**
     * @returns {Integer} 2 bytes integer in LE.
     * @param {Integer} offset From where to start reading.
     * @throws When attempting to read outside of buffer.
     */
    get_u16(offset) {
        return this.get_int(offset, 2);
    }

    /**
     * @returns {Integer} 1 byte integer in LE.
     * @param {Integer} offset From where to start reading.
     * @throws When attempting to read outside of buffer.
     */
    get_u8(offset) {
        return this.get_int(offset, 1);
    }

    /**
     * @returns {Integer} Value in LE.
     * @param {Integer} offset From where to start reading.
     * @param {Integer} num Number of bytes to extract. Allowed values 1, 2, 4.
     * @throws When attempting to read outside of buffer.
     */
    get_int(offset, num) {
        switch (num) {
            case 4:
                return this.view.getUint32(offset, true);
            case 2:
                return this.view.getUint16(offset, true);
            case 1:
                return this.view.getUint8(offset, true);
            default:
                throw "Unsupported size=" + num + " to read from save is given.";
        }
    }
}
