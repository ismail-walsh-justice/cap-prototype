/**
 * Per-child answers functionality
 * Allows users to add different answers for different children
 */

function setupPerChildAnswers() {
  const addButton = document.getElementById('add-another-child-btn');
  if (!addButton) return;

  const template = document.getElementById('per-child-entry-template');
  const container = document.getElementById('additional-children-container');
  const defaultAnswerSection = document.querySelector('.default-answer-section');
  const defaultAnswerLabel = document.querySelector('.default-answer-label');

  if (!container) return;

  // Detect design mode from the button data attribute
  const designMode = addButton.dataset.designMode || 'design1';
  const isDesign4 = designMode === 'design4';

  // Parse data from the button's data attributes
  const numberOfChildren = parseInt(addButton.dataset.numberOfChildren, 10);
  const childOptions = JSON.parse(addButton.dataset.childOptions || '[]');
  const _namesOfChildren = JSON.parse(addButton.dataset.namesOfChildren || '[]');
  const fieldBaseName = addButton.dataset.fieldBaseName;

  let entryCounter = 1; // Start from 1 since 0 is the default/all children entry

  // Track which children have been assigned specific entries
  const assignedChildren = new Set();

  /**
   * Updates the default answer label and visibility based on assigned children
   */
  function updateDefaultAnswerSection() {
    const numAssigned = assignedChildren.size;

    if (numAssigned === 0) {
      // No children assigned - show "For all children"
      if (defaultAnswerLabel) {
        defaultAnswerLabel.textContent = 'For all children:';
      }
      if (defaultAnswerSection) {
        defaultAnswerSection.style.display = '';
      }
    } else if (numAssigned >= numberOfChildren) {
      // All children have specific answers - hide the default section
      if (defaultAnswerSection) {
        defaultAnswerSection.style.display = 'none';
      }
    } else {
      // Some children assigned - show "For all other children"
      if (defaultAnswerLabel) {
        defaultAnswerLabel.textContent = 'For all other children:';
      }
      if (defaultAnswerSection) {
        defaultAnswerSection.style.display = '';
      }
    }
  }

  /**
   * Creates a new per-child entry
   */
  function addChildEntry() {
    const entryIndex = entryCounter++;
    const fieldName = `${fieldBaseName}-${entryIndex}`;

    // Use Design 4 template if in design4 mode
    const templateEl = isDesign4
      ? document.getElementById('per-child-entry-template-d4')
      : template;
    if (!templateEl) return;

    // Clone the template
    const templateContent = templateEl.content.cloneNode(true);
    const entryDiv = templateContent.querySelector('.per-child-entry');

    // Design 4: populate child checkboxes
    if (isDesign4) {
      const checkboxContainer = entryDiv.querySelector('.d4-child-checkboxes');
      if (checkboxContainer) {
        checkboxContainer.id = `child-checkboxes-${entryIndex}`;
        childOptions.forEach(function(option) {
          const item = document.createElement('div');
          item.className = 'govuk-checkboxes__item';
          item.innerHTML =
            '<input class="govuk-checkboxes__input"' +
            ' id="child-checkbox-' + entryIndex + '-' + option.value + '"' +
            ' name="child-checkbox-' + entryIndex + '"' +
            ' type="checkbox"' +
            ' value="' + option.value + '">' +
            '<label class="govuk-label govuk-checkboxes__label"' +
            ' for="child-checkbox-' + entryIndex + '-' + option.value + '">' +
            option.text +
            '</label>';
          checkboxContainer.appendChild(item);
        });
        // Re-initialize GOV.UK checkboxes
        if (window.GOVUKFrontend && window.GOVUKFrontend.Checkboxes) {
          try { new window.GOVUKFrontend.Checkboxes(checkboxContainer).init(); } catch(e) {}
        }
      }

      // Add remove button handler
      const removeBtn = entryDiv.querySelector('.remove-child-entry-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', function() {
          entryDiv.remove();
          updateAddButtonVisibility();
        });
      }

      container.appendChild(entryDiv);
      updateAddButtonVisibility();
      return; // Design 4 doesn't track child assignments
    }

    // Update entry index
    entryDiv.dataset.entryIndex = entryIndex;

    // Update selector IDs and names
    const selector = entryDiv.querySelector('select');
    const selectorId = `child-selector-${entryIndex}`;
    selector.id = selectorId;
    selector.name = selectorId;

    // Update selector label
    const selectorLabel = entryDiv.querySelector(`label[for="child-selector-ENTRY_INDEX"]`);
    if (selectorLabel) {
      selectorLabel.setAttribute('for', selectorId);
    }

    // Populate child options
    childOptions.forEach(option => {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.textContent = option.text;
      selector.appendChild(optionEl);
    });

    // Handle child selection change
    selector.addEventListener('change', function() {
      const selectedChildIndex = parseInt(this.value, 10);
      const previousValue = this.dataset.previousValue;

      // Remove previous assignment
      if (previousValue !== undefined && previousValue !== '') {
        assignedChildren.delete(parseInt(previousValue, 10));
      }

      // Add new assignment
      if (!isNaN(selectedChildIndex)) {
        assignedChildren.add(selectedChildIndex);
        this.dataset.previousValue = selectedChildIndex;
      }

      updateDefaultAnswerSection();
      updateAddButtonVisibility();
    });

    // Update textarea IDs and names (for simple textarea fields)
    const textarea = entryDiv.querySelector('textarea');
    if (textarea && !textarea.closest('.govuk-radios__conditional')) {
      // Only update simple textareas, not those inside radio conditionals
      textarea.id = fieldName;
      textarea.name = fieldName;

      // Update textarea label
      const textareaLabel = entryDiv.querySelector(`label[for="FIELD_NAME"]`);
      if (textareaLabel) {
        textareaLabel.setAttribute('for', fieldName);
      }
    }

    // Update radio button IDs and names (for radio fields)
    const radioInputs = entryDiv.querySelectorAll('input[type="radio"]');
    if (radioInputs.length > 0) {
      radioInputs.forEach(radio => {
        // Update the name attribute (all radios in a group share the same name)
        const oldName = radio.getAttribute('name');
        if (oldName === 'FIELD_NAME') {
          radio.setAttribute('name', fieldName);
        }

        // Update the id attribute
        const oldId = radio.getAttribute('id');
        if (oldId && oldId.includes('FIELD_NAME')) {
          const newId = oldId.replace(/FIELD_NAME/g, fieldName);
          radio.setAttribute('id', newId);

          // Update corresponding label's for attribute
          const label = entryDiv.querySelector(`label[for="${oldId}"]`);
          if (label) {
            label.setAttribute('for', newId);
          }

          // Update data-aria-controls if present
          const ariaControls = radio.getAttribute('data-aria-controls');
          if (ariaControls && ariaControls.includes('FIELD_NAME')) {
            const newAriaControls = ariaControls.replace(/FIELD_NAME/g, fieldName);
            radio.setAttribute('data-aria-controls', newAriaControls);
          }
        }
      });

      // Update conditional content IDs (for radio conditional reveals)
      const conditionals = entryDiv.querySelectorAll('.govuk-radios__conditional');
      conditionals.forEach(conditional => {
        const oldId = conditional.getAttribute('id');
        if (oldId && oldId.includes('FIELD_NAME')) {
          const newId = oldId.replace(/FIELD_NAME/g, fieldName);
          conditional.setAttribute('id', newId);

          // Update textarea inside conditional if present
          const conditionalTextarea = conditional.querySelector('textarea');
          if (conditionalTextarea) {
            const describeFieldName = `${fieldBaseName}-describe-arrangement-${entryIndex}`;
            const oldTextareaId = conditionalTextarea.getAttribute('id');
            if (oldTextareaId === 'DESCRIBE_FIELD_NAME') {
              conditionalTextarea.setAttribute('id', describeFieldName);
              conditionalTextarea.setAttribute('name', describeFieldName);

              // Update corresponding label
              const textareaLabel = conditional.querySelector(`label[for="DESCRIBE_FIELD_NAME"]`);
              if (textareaLabel) {
                textareaLabel.setAttribute('for', describeFieldName);
              }
            }
          }
        }
      });

      // Re-initialize GOV.UK Radios component for the new radios
      const radiosModule = entryDiv.querySelector('[data-module="govuk-radios"]');
      if (radiosModule && window.GOVUKFrontend && window.GOVUKFrontend.Radios) {
        new window.GOVUKFrontend.Radios(radiosModule).init();
      }
    }

    // Update checkbox IDs and names (for checkbox fields)
    const checkboxInputs = entryDiv.querySelectorAll('input[type="checkbox"]');
    if (checkboxInputs.length > 0) {
      checkboxInputs.forEach(checkbox => {
        // Update the name attribute (all checkboxes in a group share the same name)
        const oldName = checkbox.getAttribute('name');
        if (oldName === 'FIELD_NAME') {
          checkbox.setAttribute('name', fieldName);
        }

        // Update the id attribute
        const oldId = checkbox.getAttribute('id');
        if (oldId && oldId.includes('FIELD_NAME')) {
          const newId = oldId.replace(/FIELD_NAME/g, fieldName);
          checkbox.setAttribute('id', newId);

          // Update corresponding label's for attribute
          const label = entryDiv.querySelector(`label[for="${oldId}"]`);
          if (label) {
            label.setAttribute('for', newId);
          }

          // Update data-aria-controls if present
          const ariaControls = checkbox.getAttribute('data-aria-controls');
          if (ariaControls && ariaControls.includes('FIELD_NAME')) {
            const newAriaControls = ariaControls.replace(/FIELD_NAME/g, fieldName);
            checkbox.setAttribute('data-aria-controls', newAriaControls);
          }
        }
      });

      // Update conditional content IDs (for checkbox conditional reveals)
      const checkboxConditionals = entryDiv.querySelectorAll('.govuk-checkboxes__conditional');
      checkboxConditionals.forEach(conditional => {
        const oldId = conditional.getAttribute('id');
        if (oldId && oldId.includes('FIELD_NAME')) {
          const newId = oldId.replace(/FIELD_NAME/g, fieldName);
          conditional.setAttribute('id', newId);

          // Update textarea inside conditional if present
          const conditionalTextarea = conditional.querySelector('textarea');
          if (conditionalTextarea) {
            // For whereHandover, use someone-else field naming
            const someoneElseFieldName = fieldBaseName.includes('where-handover')
              ? `${fieldBaseName}-someone-else-${entryIndex}`
              : `${fieldBaseName}-describe-arrangement-${entryIndex}`;

            const oldTextareaId = conditionalTextarea.getAttribute('id');
            if (oldTextareaId === 'SOMEONE_ELSE_FIELD_NAME' || oldTextareaId === 'DESCRIBE_FIELD_NAME') {
              conditionalTextarea.setAttribute('id', someoneElseFieldName);
              conditionalTextarea.setAttribute('name', someoneElseFieldName);

              // Update corresponding label
              const textareaLabel = conditional.querySelector(`label[for="${oldTextareaId}"]`);
              if (textareaLabel) {
                textareaLabel.setAttribute('for', someoneElseFieldName);
              }
            }
          }
        }
      });

      // Re-initialize GOV.UK Checkboxes component for the new checkboxes
      const checkboxesModule = entryDiv.querySelector('[data-module="govuk-checkboxes"]');
      if (checkboxesModule && window.GOVUKFrontend && window.GOVUKFrontend.Checkboxes) {
        new window.GOVUKFrontend.Checkboxes(checkboxesModule).init();
      }
    }

    // Add remove button handler
    const removeBtn = entryDiv.querySelector('.remove-child-entry-btn');
    removeBtn.addEventListener('click', () => {
      // Remove from assigned children
      const selectedValue = selector.value;
      if (selectedValue !== '') {
        assignedChildren.delete(parseInt(selectedValue, 10));
      }

      entryDiv.remove();
      updateDefaultAnswerSection();
      updateAddButtonVisibility();
    });

    // Add to container
    container.appendChild(entryDiv);

    // Update visibility of add button and default section
    updateAddButtonVisibility();
    updateDefaultAnswerSection();

    // Focus the new selector
    selector.focus();
  }

  /**
   * Updates the visibility of the "Add another child" button
   * Hide it if we've added entries for all children
   */
  function updateAddButtonVisibility() {
    const existingEntries = container.querySelectorAll('.per-child-entry').length;
    // Allow adding entries up to numberOfChildren
    if (existingEntries >= numberOfChildren) {
      addButton.style.display = 'none';
    } else {
      addButton.style.display = '';
    }
  }

  // Add click handler for the "Add another child" button
  addButton.addEventListener('click', addChildEntry);

  // Update button visibility on initial load
  updateAddButtonVisibility();

  // Check for any pre-existing entries (e.g., from server-rendered data)
  const existingEntries = container.querySelectorAll('.per-child-entry');
  existingEntries.forEach(entry => {
    const selector = entry.querySelector('select');
    if (selector && selector.value !== '') {
      assignedChildren.add(parseInt(selector.value, 10));
    }
  });
  updateDefaultAnswerSection();
}

export default setupPerChildAnswers;
