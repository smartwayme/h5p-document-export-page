var H5P = H5P || {};
H5P.DocumentExportPage = H5P.DocumentExportPage || {};

/**
 * Create Document module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.DocumentExportPage.CreateDocument = (function ($, ExportPage, EventDispatcher) {
  /**
   * Initialize module.
   * @param {Array} inputFields Array of input strings that should be exported
   * @returns {Object} CreateDocument CreateDocument instance
   */
  function CreateDocument(params, title, submitEnabled, inputFields, inputGoals, template) {
    EventDispatcher.call(this);

    this.inputFields = inputFields;
    this.inputGoals = inputGoals;
    this.template = template;

    this.params = params;
    this.title = title;
    this.submitEnabled = submitEnabled;
  }

    // Setting up inheritance
  CreateDocument.prototype = Object.create(EventDispatcher.prototype);
  CreateDocument.prototype.constructor = CreateDocument;

  /**
   * Attach function called by H5P framework to insert H5P content into page.
   *
   * @param {jQuery} $container The container which will be appended to.
   */
  CreateDocument.prototype.attach = function ($container) {
    var self = this;

    var exportString = this.getExportString();
    exportString += this.createGoalsOutput();
    var exportObject = this.getExportObject();
    var exportPage = new ExportPage(this.title,
      exportString,
      this.submitEnabled,
      this.params.submitTextLabel,
      this.params.submitSuccessTextLabel,
      this.params.selectAllTextLabel,
      this.params.exportTextLabel,
      this.template,
      exportObject
    );
    exportPage.getElement().prependTo($container);
    exportPage.focus();

    exportPage.on('closed', function () {
      self.trigger('export-page-closed');
    });

    exportPage.on('submitted', function (event) {
      self.trigger('submitted', event.data);
    });
  };

  /**
   * Generate export object that will be applied to the export template
   * @returns {Object} exportObject Exportable content for filling template
   */
  CreateDocument.prototype.getExportObject = function () {
    var sortedGoalsList = [];

    this.inputGoals.inputArray.forEach(function (inputGoalPage) {
      inputGoalPage.forEach(function (inputGoal) {
        // Do not include unassessed goals
        if (inputGoal.goalAnswer() === -1) {
          return;
        }
        var goalCategoryExists = false;
        var listIndex = -1;
        sortedGoalsList.forEach(function (sortedGoalEntry, entryIndex) {
          if (inputGoal.goalAnswer() === sortedGoalEntry.goalAnswer) {
            listIndex = entryIndex;
            goalCategoryExists = true;
          }
        });
        if (!goalCategoryExists) {
          sortedGoalsList.push({label: '', goalArray: [], goalAnswer: inputGoal.goalAnswer()});
          listIndex = sortedGoalsList.length - 1;
          if (inputGoal.getTextualAnswer().length) {
            sortedGoalsList[listIndex].label = inputGoal.getTextualAnswer();
          }
        }

        if (inputGoal.goalText().length && inputGoal.getTextualAnswer().length) {
          sortedGoalsList[listIndex].goalArray.push({text: inputGoal.goalText()});
        }
      });
    });

    var flatInputsList = [];
    this.inputFields.forEach(function (inputFieldPage) {
      if (inputFieldPage.inputArray && inputFieldPage.inputArray.length) {
        var standardPage = {title: '', inputArray: []};
        if (inputFieldPage.title) {
          standardPage.title = inputFieldPage.title;
        }
        inputFieldPage.inputArray.forEach(function (inputField) {
          standardPage.inputArray.push({description: inputField.description, value: inputField.value});
        });
        flatInputsList.push(standardPage);
      }
    });

    var exportObject = {
      title: this.title,
      goalsTitle: this.inputGoals.title,
      flatInputList: flatInputsList,
      sortedGoalsList: sortedGoalsList
    };

    return exportObject;
  };

  /**
   * Generate complete html string for export
   * @returns {string} exportString Html string for export
   */
  CreateDocument.prototype.getExportString = function () {
    var self = this;
    var exportString = self.getInputBlocksString();

    return exportString;
  };

  /**
   * Generates html string for input fields
   * @returns {string} inputBlocksString Html string from input fields
   */
  CreateDocument.prototype.getInputBlocksString = function () {
    var inputBlocksString = '<div class="textfields-output">';

    this.inputFields.forEach(function (inputPage) {
      if (inputPage.inputArray && inputPage.inputArray.length && inputPage.title.length) {
        inputBlocksString +=
          '<h2>' + inputPage.title + '</h2>';
      }
      if (inputPage.inputArray && inputPage.inputArray.length) {
        inputPage.inputArray.forEach(function (inputInstance) {
          if (inputInstance) {
            // remove paragraph tags
            inputBlocksString +=
              '<p>' +
                (inputInstance.description ? '<strong>' + inputInstance.description + '</strong>\n' : '') +
                inputInstance.value +
              '</p>';
          }
        });
      }
    });

    inputBlocksString += '</div>';

    return inputBlocksString;
  };

  /**
   * Generates html string for all goals
   * @returns {string} goalsOutputString Html string from all goals
   */
  CreateDocument.prototype.createGoalsOutput = function () {

    var goalsOutputString = '<div class="goals-output">';

    if (this.inputGoals === undefined || !this.inputGoals.inputArray || this.inputGoals.inputArray.length === 0) {
      return;
    }

    if (this.inputGoals.title.length) {
      goalsOutputString +=
        '<h2>' + this.inputGoals.title + '</h2>';
    }

    this.inputGoals.inputArray.forEach(function (inputGoalPage) {
      var goalOutputArray = [];

      inputGoalPage.forEach(function (inputGoalInstance) {
        if (inputGoalInstance !== undefined && inputGoalInstance.goalAnswer() > -1) {
          // Sort goals on answer
          var htmlString = '';
          if (goalOutputArray[inputGoalInstance.goalAnswer()] === undefined) {
            goalOutputArray[inputGoalInstance.goalAnswer()] = [];
            var answerStringTitle = '<p class="category"><strong>' + inputGoalInstance.getTextualAnswer() + ':</strong></p><ul>';
            goalOutputArray[inputGoalInstance.goalAnswer()].push(answerStringTitle);
          }
          htmlString += '<li>' + inputGoalInstance.text + '</li>';
          goalOutputArray[inputGoalInstance.goalAnswer()].push(htmlString);
        }
      });

      goalOutputArray.forEach(function (goalOutput) {
        goalOutput.forEach(function (goalString) {
          goalsOutputString += goalString;
        });
        if (goalOutput.length) {
          goalsOutputString += '</ul>';
        }
      });
    });

    goalsOutputString += '</div>';

    return goalsOutputString;
  };

  return CreateDocument;
}(H5P.jQuery, H5P.ExportPage, H5P.EventDispatcher));
