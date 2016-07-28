'use strict';

function handleDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function fileErrorHandler(event) {
    switch (event.target.error.code) {
        case event.target.error.NOT_FOUND_ERR:
            alert('File Not Found!');
            break;
        case event.target.error.NOT_READABLE_ERR:
            alert('Cannot read file');
            break;
        case event.target.error.ABORT_ERR:
            break; // noop
        default:
            alert('An error occurred reading this file.');
    }
}

function selectEventFiles(event) {
    if (event.target.files) {
        //load from file dialogue
        return event.target.files;
    }
    else {
        //drag&drop
        event.stopPropagation();
        event.preventDefault();
        return event.dataTransfer.files;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports.selectEventFiles = selectEventFiles;
    module.exports.handleDragOver = handleDragOver;
    module.exports.fileErrorHandler = fileErrorHandler;
}
