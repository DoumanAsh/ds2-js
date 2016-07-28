'use strict';

var common = require("./common.js");
var saveAs = require("./3pp/FileSaver.min.js").saveAs;

var selectEventFiles = common.selectEventFiles;
var fileErrorHandler = common.fileErrorHandler;

/**
 * DS2 RB Save representation.
 *
 * @param name Name of save file.
 * @param buffer Byte array with content of file.
 */
function Save(name, buffer) {
    this.name = name;
    this.buffer = buffer;
    this.view = new DataView(this.buffer);

    this.ui = {
        'macca': document.getElementById('macca_input')
    };

    this.to_disk = function() {
        var buff = new Uint8Array(this.buffer);
        var blob = new Blob(buff, {type: "application/octet-stream;charset=ISO8859-1"});
        // TODO: fix encoding of saved file.
        saveAs(blob, this.name, true);
    };

    /**
     * Initializes UI with save's values.
     */
    this.init_ui = function() {
        this.ui.macca.value = this.get_int(0x6C4, 4);
    };

    /**
     * @return Integer in LE.
     *
     * @param offset From where to start reading.
     * @param num Number of bytes to extract.
     */
    this.get_int = function(offset, num) {
        if (offset > this.buffer.byteLength) {
            throw "offset=" + offset + " is greater than save length=" + this.buffer.byteLength;
        }
        if ((offset + num) > this.buffer.byteLength) {
            throw "Cannot read " + num + "from save offset=" + offset + ". Length is only " + this.buffer.byteLength;
        }

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
    };
}

var save;

/**
 * @retval true if buffer contains DS2 save data.
 * @retval false Otherwise.
 *
 * @param buffer Byte array with DS2 save data.
 */
function is_ds2_save(buffer) {
    var ds2_start_bytes = [0x44, 0x65, 0x76, 0x69];

    if (buffer.length < ds2_start_bytes.length) {
        return false;
    }

    for (var idx = 0; idx < ds2_start_bytes.length; idx++) {
        if (buffer[idx] !== ds2_start_bytes[idx]) {
            return false;
        }
    }

    return true;
}

function ds2SaveLoad(event) {
    var files = selectEventFiles(event);

    var file = files[0];
    var reader = new FileReader();

    reader.onerror = fileErrorHandler;
    reader.onloadend = function(result) {
        var buffer = result.target.result;

        if (is_ds2_save(new Uint8Array(buffer, 0, 4))) {
            save = new Save(file.name, buffer);
            save.init_ui();
        }
        else {
            alert("Invalid Devil Survivor 2 RB save");
        }
    };

    reader.readAsArrayBuffer(file);
}

function ds2SaveNew() {
    if (save) {
        save.to_disk();
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports.saveLoad = ds2SaveLoad;
    module.exports.saveNew = ds2SaveNew;
}
