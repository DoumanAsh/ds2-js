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

    /* NOTE: Check member order in layot. */
    this.ui = {
        'macca': {
            dom: document.getElementById('macca_input'),
            offset: 0x6C4,
            on_change: input4bytes,
            len: 4
        }
    };

    for (var idx = 0; idx < 4; idx++) {
        this.ui[idx+1+"_exp"] = {
            dom: document.getElementById('member_'+(idx+1)).children[0].children[1],
            offset: 0x7C + idx*0x24,
            on_change: party_exp,
            len: 2
        };
        this.ui[idx+1+"_hp"] = {
            dom: document.getElementById('member_'+(idx+1)).children[1].children[1],
            offset: 0x82 + idx*0x24,
            on_change: party_hp,
            len: 2
        };
        this.ui[idx+1+"_mp"] = {
            dom: document.getElementById('member_'+(idx+1)).children[2].children[1],
            offset: 0x84 + idx*0x24,
            on_change: party_hp,
            len: 2
        };
        this.ui[idx+1+"_str"] = {
            dom: document.getElementById('member_'+(idx+1)).children[3].children[1],
            offset: 0x7E + idx*0x24,
            on_change: party_stat,
            len: 1
        };
        this.ui[idx+1+"_mag"] = {
            dom: document.getElementById('member_'+(idx+1)).children[4].children[1],
            offset: 0x7F + idx*0x24,
            on_change: party_stat,
            len: 1
        };
        this.ui[idx+1+"_vit"] = {
            dom: document.getElementById('member_'+(idx+1)).children[5].children[1],
            offset: 0x80 + idx*0x24,
            on_change: party_stat,
            len: 1
        };
        this.ui[idx+1+"_agi"] = {
            dom: document.getElementById('member_'+(idx+1)).children[6].children[1],
            offset: 0x81 + idx*0x24,
            on_change: party_stat,
            len: 1
        };
        this.ui[idx+1+"_move"] = {
            dom: document.getElementById('member_'+(idx+1)).children[7].children[1],
            offset: 0x9F + idx*0x24,
            on_change: party_stat,
            len: 1
        };
    }

    /**
     * Prompt user to download save.
     *
     * @note File will be saved as binary one.
     */
    this.to_disk = function() {
        var file = new Blob([new Uint8Array(this.buffer)],
                            {type: "data:application/octet-stream;base64,"});
        saveAs(file, this.name);
    };

    /**
     * Initializes UI with save's values.
     */
    this.init_ui = function() {
        for (var key in this.ui) {
            if (this.ui.hasOwnProperty(key)) {
                this.ui[key].dom.value = this.get_int(this.ui[key].offset, this.ui[key].len);
                this.ui[key].dom.disabled = false;
                this.ui[key].dom.oninput = this.ui[key].on_change;
                this.ui[key].dom.onpropertychange = this.ui[key].on_change; // for IE8
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
     * Writes value into save's view as LE.
     *
     * @param offset From where to start reading.
     * @param num Number of bytes to write.
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

/**
 * File upload event handler.
 *
 * It checks file to be in correct format.
 * Initializes UI if file is ok.
 */
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

/**
 * Trigger save to disk.
 *
 * Alerts if no save is uploaded.
 */
function ds2SaveNew() {
    if (save) {
        save.to_disk();
    }
    else {
        alert("No save is uploaded");
    }
}

/**
 * @return On change event handler for party input.
 *
 * @param max_val Max possible integer input.
 */
function party_input_create(max_val) {
    return function(ev) {
        if (!save) {
            return;
        }

        var invalid = function(target) {
            if (!target.className.includes("invalid")) {
                target.className += "invalid";
                target.title = "Allowed values: [0; " + max_val + "]";
            }
        };

        var valid = function(target) {
            target.className = target.className.replace("invalid", "");
            target.title = "";
        };

        var value = parseInt(ev.target.value);
        if (value < 0 || value > max_val) {
            invalid(ev.target);
            return;
        }

        valid(ev.target);
        var parent_idx = ev.target.parentElement.parentElement.id.substr(-1);
        var name = parent_idx + '_' + ev.target.id;

        save.set_ui_val(name, value);
    };
}

/**
 * On change event handler to input with max 4 bytes size.
 *
 * It verifies that input value is valid number with size at most 4 bytes.
 */
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

    var value = parseInt(ev.target.value);
    if (value < 0 || value > 0xFFFFFFFF) {
        invalid(ev.target);
        return;
    }

    valid(ev.target);
    var name = ev.target.id.replace("_input", "");

    save.set_ui_val(name, value);
}

var party_stat = party_input_create(0x28);
var party_hp = party_input_create(0x3E7);
var party_exp = party_input_create(0xFFFF);

if (typeof module !== "undefined" && module.exports) {
    module.exports.saveLoad = ds2SaveLoad;
    module.exports.saveNew = ds2SaveNew;
}
