const downloadsFolder = Cypress.config('downloadsFolder');

export default {
  findDownloadedFilesByMask(mask) {
    /*
    more about masks: https://github.com/isaacs/minimatch#usage
    returns array with all files matched to mask
    */
    return cy.task('findFiles', `cypress/downloads/${mask}`);
  },

  deleteFolder(pathToFolder) {
    return cy.task('deleteFolder', pathToFolder);
  },

  readFile(pathToFile) {
    return cy.readFile(pathToFile);
  },

  createFile(pathToFile, content = ' ') {
    // default value for content is a string with an empty space character
    // because, cypress-file-upload plugin doesn't allow empty files

    return cy.writeFile(pathToFile, content);
  },

  appendFile(pathToFile, content) {
    return cy.writeFile(pathToFile, content, { flag: 'a+' });
  },

  deleteFile(pathToFile) {
    return cy.task('deleteFile', pathToFile);
  },

  deleteFileFromDownloadsByMask(...fileNameMasks) {
    fileNameMasks.forEach(fileNameMask => {
      this.findDownloadedFilesByMask(fileNameMask)
        .then((fileName) => {
          cy.task('deleteFile', fileName[0]);
        });
    });
  },

  verifyFile(verifyNameFunc, fileNameMask, verifyContentFunc, verifyContentFuncArgs = []) {
    /*
    verifyNameFunc: function for verifying file name
    verifyContentFunc: function for verifying file content
    fileMask: mask for searching file in downloads folder
    verifyContentFuncArgs: array. Arguments for verify content function if needed
    */

    // Need time for download file TODO: think about how it can be fixed
    cy.wait(Cypress.env('downloadTimeout'));

    this.findDownloadedFilesByMask(fileNameMask)
      .then((downloadedFilenames) => {
        const lastDownloadedFilename = downloadedFilenames.sort()[downloadedFilenames.length - 1];
        verifyNameFunc(lastDownloadedFilename);

        this.readFile(lastDownloadedFilename)
          .then((actualContent) => {
            verifyContentFunc(actualContent, ...verifyContentFuncArgs);
          });
      });
  },

  getFileNameFromFilePath(path) {
    const fullPathToFile = path.split('/');
    return fullPathToFile[fullPathToFile.length - 1];
  },

  renameFile(fileNameMask, fileName) {
    /*
    verifyNameFunc: function for verifying file name
    fileMask: mask for searching file in downloads folder
    */
    // Need time for download file TODO: think about how it can be fixed
    cy.wait(Cypress.env('downloadTimeout'));

    return this.findDownloadedFilesByMask(fileNameMask)
      .then((downloadedFilenames) => {
        const lastDownloadedFilename = downloadedFilenames.sort()[downloadedFilenames.length - 1];

        this.readFile(lastDownloadedFilename)
          .then((actualContent) => {
            return this.createFile(`${downloadsFolder}/${fileName}`, actualContent).then(() => (this.deleteFile(lastDownloadedFilename)));
          });
      });
  }
};
