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
        'macca': {
            dom: document.getElementById('macca_input'),
            offset: 0x6C4,
            len: 4
        }
    };

    /**
     * Prompt user to download save.
     *
     * @note File will be saved as binary one.
     */
    this.to_disk = function() {
        var file = new File([new Uint8Array(this.buffer)],
                            this.name,
                            {type: "data:application/octet-stream;base64,"});
        saveAs(file);
    };

    /**
     * Initializes UI with save's values.
     */
    this.init_ui = function() {
        for (var key in this.ui) {
            if (this.ui.hasOwnProperty(key)) {
                this.ui[key].dom.value = this.get_int(this.ui[key].offset, this.ui[key].len);
                this.ui[key].dom.disabled = false;
            }
            else {
                console.log("Error: unknown ui key=" + key);
            }
        }
    };

    /**
     * Sets value of UI's element.
     *
     * @param name Name of existing element. Throws on invalid name.
     * @param value New value of element.
     */
    this.set_ui_val = function(name, value) {
        if (!(name in this.ui)) {
            throw "Invalid UI element '" + name + "' is attempted to be set";
        }

        this.set_int(this.ui[name].offset, value, this.ui[name].len);
    };

    /**
     * Writes value into save's view.
     *
     * @param offset From where to start reading.
     * @param num Number of bytes to extract.
     */

    this.set_int = function(offset, value, num) {
        if (offset > this.buffer.byteLength) {
            throw "offset=" + offset + " is greater than save length=" + this.buffer.byteLength;
        }
        if ((offset + num) > this.buffer.byteLength) {
            throw "Cannot read " + num + "from save offset=" + offset + ". Length is only " + this.buffer.byteLength;
        }

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
            show_warning();
        }
        else {
            alert("Invalid Devil Survivor 2 RB save");
        }
    };

    reader.readAsArrayBuffer(file);
}

/**
 * Shows warning message stored by id 'warning'
 *
 * It just adds class show.
 */
var show_warning = function() {
    document.getElementById('warning').className += " show";
    show_warning = function () {
        return;
    };
};

function ds2SaveNew() {
    if (save) {
        save.to_disk();
    }
    else {
        alert("No save is uploaded");
    }
}

function input4bytes(ev) {
    if (!save) {
        return;
    }

    var invalid = function(target) {
        if (!target.className.includes("invalid")) {
            target.className += "invalid";
            target.title = "Allowed values: [0; " + 0xFFFFFFFF + "]";
        }
    };

    var valid = function(target) {
        target.className = target.className.replace("invalid", "");
        target.title = "";
    };

    if (!ev.target.value || isNaN(ev.target.value)) {
        invalid(ev.target);
        return;
    }

    console.log(ev.target.value);
    var value = parseInt(ev.target.value);
    console.log(value);
    if (value < 0 || value > 0xFFFFFFFF) {
        invalid(ev.target);
        return;
    }

    valid(ev.target);
    var name = ev.target.id.replace("_input", "");

    save.set_ui_val(name, value);
}

if (typeof module !== "undefined" && module.exports) {
    module.exports.saveLoad = ds2SaveLoad;
    module.exports.saveNew = ds2SaveNew;
    module.exports.input4bytes = input4bytes;
}
