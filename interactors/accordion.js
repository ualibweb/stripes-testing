import { Button } from '@interactors/html';
import { isVisible } from 'element-is-visible';
import HTML from './baseHTML';

const content = (el) => el.textContent;
function label(element) {
  const labelEl = element.querySelector('[class^=labelArea]');
  return labelEl ? labelEl.textContent.trim() : '';
}

export default HTML.extend('accordion')
  .selector('[class^=accordion]')
  .locator(label)
  .filters({
    content,
    label,
    headline: (el) => el.querySelector('[class^=headline-]').textContent,
    id: (el) => el.id,
    open: (el) => isVisible(el.querySelector('[class^=content-region]')),
    contentHeight: (el) => el.querySelector('[class^=content-region]').offsetHeight,
    itemsAmount: (el) => el.querySelector('[class^=mclEndOfListContainer-]').getAttribute('data-end-of-list'),
    contentId: (el) => {
      const id = el.querySelector('[class^=content-region]').id;
      if (id.startsWith('accordion')) {
        return '@@autogenerated@@';
      } else {
        return id;
      }
    },
    focused: (el) => {
      const focus = el.ownerDocument.activeElement;
      return el.contains(focus);
    },
    index: (el) => {
      const set = el.parentNode;
      const accordions = [...set.querySelectorAll('[class^=accordion]')];

      for (let i = 0; i < accordions.length; i++) {
        if (el === accordions[i]) {
          return i;
        }
      }

      return undefined;
    },
    // related with common checks of accordion elements(disabled for example)
    textareaNames: (el) => [...el.querySelectorAll('textarea')].map((textarea) => textarea.getAttribute('name')),
    selectNames: (el) => [...el.querySelectorAll('select')].map((select) => select.getAttribute('name')),
    // TODO: add special unique attribute to each delete button
    // buttonAriaLabels: el => [...el.querySelectorAll('div[class^=content-] button')].map(button => button.getAttribute('aria-label')),
    buttonIds: (el) => [...el.querySelectorAll('div[class^=content-] button')]
      .map((button) => button.getAttribute('id'))
      .filter((id) => id),
    buttonContainsText: (el) => [...el.querySelectorAll('div[class^=content-] button')]
      .map((button) => button.textContent)
      .filter((id) => id),
    inputNames: (el) => [...el.querySelectorAll('input')].map((input) => input.getAttribute('name')),
  })
  .actions({
    clickHeader: ({ perform }) => perform((el) => el.querySelector('[class^=labelArea-]').click()),
    focus: ({ find }) => find(Button()).focus(),
  });
