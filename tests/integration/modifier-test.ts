import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, waitUntil, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon, { SinonSpy } from 'sinon';
import { TestContext } from 'ember-test-helpers';
import { Sizes } from 'ember-element-query';
import pause from '../helpers/pause';
import { setupWindowMock } from 'ember-window-mock/test-support';

interface TestContextCustom extends TestContext {
  callback?: SinonSpy;
  actualWidth?: number;
  actualHeight?: number;
  sizes?: Sizes;
  sizesHeight?: Sizes;
  prefix?: string;
  isDisabled?: boolean;
}

module('Integration | Modifier | element-query', function (hooks) {
  let m;

  setupRenderingTest(hooks);
  setupWindowMock(hooks);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  test('do not crash on missing resize observer', async function (this: TestContextCustom, assert) {
    // @ts-ignore https://github.com/Microsoft/TypeScript/issues/28502#issuecomment-609607344
    const resizeObserver = window.ResizeObserver as unknown;
    // @ts-ignore https://github.com/Microsoft/TypeScript/issues/28502#issuecomment-609607344
    window.ResizeObserver = undefined;

    await render(hbs`
      {{! template-lint-disable no-inline-styles }}
      <div
        {{element-query}}
      >
      </div>
    `);

    m = 'Element is rendered';
    assert.ok(true, m);

    // @ts-ignore https://github.com/Microsoft/TypeScript/issues/28502#issuecomment-609607344
    window.ResizeObserver = resizeObserver;
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  test('calls the onResize callback', async function (this: TestContextCustom, assert) {
    let callCount = 0;
    this.callback = sinon.spy(() => callCount++);

    await render(hbs`
      {{! template-lint-disable no-inline-styles }}
      <div
        id="test-subject"
        style="width: 300px; height: 100px;"
        {{element-query onResize=this.callback}}
      >
      </div>
    `);

    const element = find('#test-subject') as HTMLElement | null;
    if (!element) throw new Error('Expected element to exist');

    m = 'Element is rendered';
    assert.ok(true, m);

    await waitUntil(() => callCount === 1);

    m = 'Callback called once';
    assert.ok(true, m);

    sinon.assert.calledWithExactly(
      this.callback.firstCall,
      sinon.match({
        element,
        width: 300,
        height: 100,
        ratio: 3,
        size: 'xs',
        sizeHeight: undefined,
        sizeRatio: undefined,
        prefix: undefined,
        attributes: [
          'at-xs',
          'from-xxs',
          'from-xs',
          'to-xs',
          'to-s',
          'to-m',
          'to-l',
          'to-xl',
          'to-xxl',
          'to-xxxl',
        ],
      })
    );

    element.style.width = '400px';

    await waitUntil(() => callCount === 2);

    m = 'Callback called twice';
    assert.ok(true, m);

    // prettier-ignore
    sinon.assert.calledWithMatch(
      this.callback.secondCall,
      {
        element,
        width: 400,
        height: 100,
        ratio: 4,
        size: 's',
        sizeHeight: undefined,
        sizeRatio: undefined,
        prefix: undefined,
        attributes: [
          'at-s',
          'from-xxs',
          'from-xs',
          'from-s',
          'to-s',
          'to-m',
          'to-l',
          'to-xl',
          'to-xxl',
          'to-xxxl',
        ],
      }
    );

    assert.ok(true);
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  test('does not call the onResize when isDisabled is initially set', async function (this: TestContextCustom, assert) {
    let callCount = 0;
    this.callback = sinon.spy(() => callCount++);

    await render(hbs`
      {{! template-lint-disable no-inline-styles }}
      <div
        id="test-subject"
        style="width: 300px; height: 100px;"
        {{element-query onResize=this.callback isDisabled=true}}
      >
      </div>
    `);

    const element = find('#test-subject') as HTMLElement | null;
    if (!element) throw new Error('Expected element to exist');

    m = 'Element is rendered';
    assert.ok(true, m);

    await pause(500);

    m = 'Call count';
    assert.equal(callCount, 0, m);

    m = 'Attr `at-xs` presence';
    assert.equal(element.getAttribute('at-xs'), null, m);
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  test('stops calling the onResize callback after updating isDisabled after rendering', async function (this: TestContextCustom, assert) {
    let callCount = 0;
    this.callback = sinon.spy(() => callCount++);
    this.set('isDisabled', false);

    await render(hbs`
      {{! template-lint-disable no-inline-styles }}
      <div
        id="test-subject"
        style="width: 300px; height: 100px;"
        {{element-query onResize=this.callback isDisabled=this.isDisabled}}
      >
      </div>
    `);

    const element = find('#test-subject') as HTMLElement | null;
    if (!element) throw new Error('Expected element to exist');

    m = 'Element is rendered';
    assert.ok(true, m);

    await waitUntil(() => callCount === 1);

    m = 'Callback called once';
    assert.ok(true, m);

    sinon.assert.calledWithExactly(
      this.callback.firstCall,
      sinon.match({
        element,
        width: 300,
        height: 100,
        ratio: 3,
        size: 'xs',
        sizeHeight: undefined,
        sizeRatio: undefined,
        prefix: undefined,
        attributes: [
          'at-xs',
          'from-xxs',
          'from-xs',
          'to-xs',
          'to-s',
          'to-m',
          'to-l',
          'to-xl',
          'to-xxl',
          'to-xxxl',
        ],
      })
    );

    this.set('isDisabled', true);

    element.style.width = '400px';

    await pause(500);

    m = 'Call count';
    assert.equal(callCount, 1, m);

    m = 'Attr `at-s` presence';
    assert.equal(element.getAttribute('at-s'), null, m);
  });

  //

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  test('attributes smoke test + update on arguments change test', async function (this: TestContextCustom, assert) {
    this.set('sizes', { small: 0, large: 300 });

    await render(hbs`
      {{! template-lint-disable no-inline-styles }}
      <div
        id="test-subject"
        style="width: 500px; height: 100px;"
        {{element-query sizes=this.sizes}}
      >
      </div>
    `);

    const element = find('#test-subject') as HTMLElement | null;
    if (!element) throw new Error('Expected element to exist');

    m = 'Element is rendered';
    assert.ok(true, m);

    await waitUntil(() => element.getAttribute('at-large') != null);

    m = 'Initial attribute is applied';
    assert.ok(true, m);

    this.set('sizes', { small: 0, large: 600 });

    await waitUntil(() => element.getAttribute('at-small') != null);

    m = 'Final attribute is applied';
    assert.ok(true, m);
  });

  //

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  test('usning multiple modifiers on the same element with custom sizes', async function (this: TestContextCustom, assert) {
    await render(hbs`
      {{! template-lint-disable no-inline-styles }}
      <div
        id="test-subject"
        style="width: 500px; height: 100px;"
        {{element-query sizes=(hash w-small=0 w-medium=300 w-large=600)}}
        {{element-query sizesHeight=(hash h-small=0 h-medium=300 h-large=600) sizes=false}}
      >
      </div>
    `);

    const element = find('#test-subject') as HTMLElement | null;
    if (!element) throw new Error('Expected element to exist');

    m = 'Element is rendered';
    assert.ok(true, m);

    await waitUntil(() => element.getAttribute('at-w-medium') != null);

    m = 'Width attribute is applied';
    assert.ok(true, m);

    await waitUntil(() => element.getAttribute('at-h-small') != null);

    m = 'Height attribute is applied';
    assert.ok(true, m);
  });

  ///

  module('attributes', function (/* hooks */) {
    module('default dimension', function (/* hooks */) {
      module('default sizes', function (/* hooks */) {
        // prettier-ignore
        const cases = [
          { actualWidth: 0,                        expectedAttributes: ['at-xxs',  'from-xxs', 'to-xxs',  'to-xs',  'to-s',   'to-m',   'to-l',    'to-xl',    'to-xxl',    'to-xxxl']},
          { actualWidth: 400,                      expectedAttributes: ['at-s',    'from-xxs', 'from-xs', 'from-s', 'to-s',   'to-m',   'to-l',    'to-xl',    'to-xxl',    'to-xxxl']},
          { actualWidth: 550,                      expectedAttributes: ['at-s',    'from-xxs', 'from-xs', 'from-s', 'to-s',   'to-m',   'to-l',    'to-xl',    'to-xxl',    'to-xxxl']},
          { actualWidth: 599,                      expectedAttributes: ['at-s',    'from-xxs', 'from-xs', 'from-s', 'to-s',   'to-m',   'to-l',    'to-xl',    'to-xxl',    'to-xxxl']},
          { actualWidth: 600,                      expectedAttributes: ['at-m',    'from-xxs', 'from-xs', 'from-s', 'from-m', 'to-m',   'to-l',    'to-xl',    'to-xxl',    'to-xxxl']},
          { actualWidth: 1650,                     expectedAttributes: ['at-xxxl', 'from-xxs', 'from-xs', 'from-s', 'from-m', 'from-l', 'from-xl', 'from-xxl', 'from-xxxl', 'to-xxxl']},
          { actualWidth: 0,    prefix: 'data-eq-', expectedAttributes: ['data-eq-at-xxs',  'data-eq-from-xxs', 'data-eq-to-xxs',  'data-eq-to-xs',  'data-eq-to-s',   'data-eq-to-m',   'data-eq-to-l',    'data-eq-to-xl',    'data-eq-to-xxl',    'data-eq-to-xxxl']},
          { actualWidth: 400,  prefix: 'data-eq-', expectedAttributes: ['data-eq-at-s',    'data-eq-from-xxs', 'data-eq-from-xs', 'data-eq-from-s', 'data-eq-to-s',   'data-eq-to-m',   'data-eq-to-l',    'data-eq-to-xl',    'data-eq-to-xxl',    'data-eq-to-xxxl']},
          { actualWidth: 550,  prefix: 'data-eq-', expectedAttributes: ['data-eq-at-s',    'data-eq-from-xxs', 'data-eq-from-xs', 'data-eq-from-s', 'data-eq-to-s',   'data-eq-to-m',   'data-eq-to-l',    'data-eq-to-xl',    'data-eq-to-xxl',    'data-eq-to-xxxl']},
          { actualWidth: 599,  prefix: 'data-eq-', expectedAttributes: ['data-eq-at-s',    'data-eq-from-xxs', 'data-eq-from-xs', 'data-eq-from-s', 'data-eq-to-s',   'data-eq-to-m',   'data-eq-to-l',    'data-eq-to-xl',    'data-eq-to-xxl',    'data-eq-to-xxxl']},
          { actualWidth: 600,  prefix: 'data-eq-', expectedAttributes: ['data-eq-at-m',    'data-eq-from-xxs', 'data-eq-from-xs', 'data-eq-from-s', 'data-eq-from-m', 'data-eq-to-m',   'data-eq-to-l',    'data-eq-to-xl',    'data-eq-to-xxl',    'data-eq-to-xxxl']},
          { actualWidth: 1650, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-xxxl', 'data-eq-from-xxs', 'data-eq-from-xs', 'data-eq-from-s', 'data-eq-from-m', 'data-eq-from-l', 'data-eq-from-xl', 'data-eq-from-xxl', 'data-eq-from-xxxl', 'data-eq-to-xxxl']},
        ];

        const allAttributes = [
          'to-xxs',
          'to-xs',
          'to-s',
          'to-m',
          'to-l',
          'to-xl',
          'to-xxl',
          'to-xxxl',
          'from-xxs',
          'from-xs',
          'from-s',
          'from-m',
          'from-l',
          'from-xl',
          'from-xxl',
          'from-xxxl',
          'at-xxs',
          'at-xs',
          'at-s',
          'at-m',
          'at-l',
          'at-xl',
          'at-xxl',
          'at-xxxl',
        ];

        cases.forEach(({ actualWidth, expectedAttributes, prefix }) => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/restrict-template-expressions
          test(`width ${actualWidth}, prefix ${prefix}`, async function (this: TestContextCustom, assert) {
            this.actualWidth = actualWidth;
            this.prefix = prefix;

            let allAttributesEffective = allAttributes;
            if (prefix) {
              allAttributesEffective = allAttributesEffective.map((attr) => prefix + attr);
            }

            const missingAttributes = allAttributesEffective.filter(
              (attr) => !expectedAttributes?.includes(attr)
            );

            await render(hbs`
              {{! template-lint-disable no-inline-styles style-concatenation }}
              <div
                id="test-subject"
                style="width: {{this.actualWidth}}px; height: 100px;"
                {{element-query prefix=this.prefix}}
              >
              </div>
            `);

            const element = find('#test-subject') as HTMLElement | null;
            if (!element) throw new Error('Expected element to exist');

            m = 'Element is rendered';
            assert.ok(true, m);

            for (const attr of expectedAttributes) {
              await waitUntil(() => element.getAttribute(attr) != null);

              m = `Attribute ${attr} is expected to exist on the element`;
              assert.ok(true, m);
            }

            for (const attr of missingAttributes) {
              await waitUntil(() => element.getAttribute(attr) == null);

              m = `Attribute ${attr} is expected NOT to exist on the element`;
              assert.ok(true, m);
            }
          });
        });
      });

      module('custom sizes', function (/* hooks */) {
        const sizes = { small: 0, medium: 300, large: 700 };

        // prettier-ignore
        const cases = [
          { actualWidth: 299,                     expectedAttributes: ['at-small',  'from-small', 'to-small',    'to-medium',  'to-large']},
          { actualWidth: 0,                       expectedAttributes: ['at-small',  'from-small', 'to-small',    'to-medium',  'to-large']},
          { actualWidth: 150,                     expectedAttributes: ['at-small',  'from-small', 'to-small',    'to-medium',  'to-large']},
          { actualWidth: 300,                     expectedAttributes: ['at-medium', 'from-small', 'from-medium', 'to-medium',  'to-large']},
          { actualWidth: 450,                     expectedAttributes: ['at-medium', 'from-small', 'from-medium', 'to-medium',  'to-large']},
          { actualWidth: 699,                     expectedAttributes: ['at-medium', 'from-small', 'from-medium', 'to-medium',  'to-large']},
          { actualWidth: 700,                     expectedAttributes: ['at-large',  'from-small', 'from-medium', 'from-large', 'to-large']},
          { actualWidth: 299, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-small',  'data-eq-from-small', 'data-eq-to-small',    'data-eq-to-medium',  'data-eq-to-large']},
          { actualWidth: 0,   prefix: 'data-eq-', expectedAttributes: ['data-eq-at-small',  'data-eq-from-small', 'data-eq-to-small',    'data-eq-to-medium',  'data-eq-to-large']},
          { actualWidth: 150, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-small',  'data-eq-from-small', 'data-eq-to-small',    'data-eq-to-medium',  'data-eq-to-large']},
          { actualWidth: 300, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-medium', 'data-eq-from-small', 'data-eq-from-medium', 'data-eq-to-medium',  'data-eq-to-large']},
          { actualWidth: 450, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-medium', 'data-eq-from-small', 'data-eq-from-medium', 'data-eq-to-medium',  'data-eq-to-large']},
          { actualWidth: 699, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-medium', 'data-eq-from-small', 'data-eq-from-medium', 'data-eq-to-medium',  'data-eq-to-large']},
          { actualWidth: 700, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-large',  'data-eq-from-small', 'data-eq-from-medium', 'data-eq-from-large', 'data-eq-to-large']},
        ];

        const allAttributes = [
          'at-small',
          'at-medium',
          'at-large',
          'from-small',
          'from-medium',
          'from-large',
          'to-small',
          'to-medium',
          'to-large',
        ];

        cases.forEach(({ actualWidth, expectedAttributes, prefix }) => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/restrict-template-expressions
          test(`width ${actualWidth}, prefix: ${prefix}`, async function (this: TestContextCustom, assert) {
            this.actualWidth = actualWidth;
            this.sizes = sizes;
            this.prefix = prefix;

            let allAttributesEffective = allAttributes;
            if (prefix) {
              allAttributesEffective = allAttributesEffective.map((attr) => prefix + attr);
            }

            const missingAttributes = allAttributesEffective.filter(
              (attr) => !expectedAttributes?.includes(attr)
            );

            await render(hbs`
              {{! template-lint-disable no-inline-styles style-concatenation }}
              <div
                id="test-subject"
                style="width: {{this.actualWidth}}px; height: 100px;"
                {{element-query sizes=this.sizes prefix=this.prefix}}
              >
              </div>
            `);

            const element = find('#test-subject') as HTMLElement | null;
            if (!element) throw new Error('Expected element to exist');

            m = 'Element is rendered';
            assert.ok(true, m);

            for (const attr of expectedAttributes) {
              await waitUntil(() => element.getAttribute(attr) != null);

              m = `Attribute ${attr} is expected to exist on the element`;
              assert.ok(true, m);
            }

            for (const attr of missingAttributes) {
              await waitUntil(() => element.getAttribute(attr) == null);

              m = `Attribute ${attr} is expected NOT to exist on the element`;
              assert.ok(true, m);
            }
          });
        });
      });
    });

    module('dimension height', function (/* hooks */) {
      module('default sizes', function (/* hooks */) {
        // prettier-ignore
        const cases = [
          { actualHeight: 0,                        expectedAttributes: ['at-xxs-height',  'from-xxs-height', 'to-xxs-height',  'to-xs-height',  'to-s-height',   'to-m-height',   'to-l-height',    'to-xl-height',    'to-xxl-height',    'to-xxxl-height']},
          { actualHeight: 400,                      expectedAttributes: ['at-s-height',    'from-xxs-height', 'from-xs-height', 'from-s-height', 'to-s-height',   'to-m-height',   'to-l-height',    'to-xl-height',    'to-xxl-height',    'to-xxxl-height']},
          { actualHeight: 550,                      expectedAttributes: ['at-s-height',    'from-xxs-height', 'from-xs-height', 'from-s-height', 'to-s-height',   'to-m-height',   'to-l-height',    'to-xl-height',    'to-xxl-height',    'to-xxxl-height']},
          { actualHeight: 599,                      expectedAttributes: ['at-s-height',    'from-xxs-height', 'from-xs-height', 'from-s-height', 'to-s-height',   'to-m-height',   'to-l-height',    'to-xl-height',    'to-xxl-height',    'to-xxxl-height']},
          { actualHeight: 600,                      expectedAttributes: ['at-m-height',    'from-xxs-height', 'from-xs-height', 'from-s-height', 'from-m-height', 'to-m-height',   'to-l-height',    'to-xl-height',    'to-xxl-height',    'to-xxxl-height']},
          { actualHeight: 1650,                     expectedAttributes: ['at-xxxl-height', 'from-xxs-height', 'from-xs-height', 'from-s-height', 'from-m-height', 'from-l-height', 'from-xl-height', 'from-xxl-height', 'from-xxxl-height', 'to-xxxl-height']},
          { actualHeight: 0,    prefix: 'data-eq-', expectedAttributes: ['data-eq-at-xxs-height',  'data-eq-from-xxs-height', 'data-eq-to-xxs-height',  'data-eq-to-xs-height',  'data-eq-to-s-height',   'data-eq-to-m-height',   'data-eq-to-l-height',    'data-eq-to-xl-height',    'data-eq-to-xxl-height',    'data-eq-to-xxxl-height']},
          { actualHeight: 400,  prefix: 'data-eq-', expectedAttributes: ['data-eq-at-s-height',    'data-eq-from-xxs-height', 'data-eq-from-xs-height', 'data-eq-from-s-height', 'data-eq-to-s-height',   'data-eq-to-m-height',   'data-eq-to-l-height',    'data-eq-to-xl-height',    'data-eq-to-xxl-height',    'data-eq-to-xxxl-height']},
          { actualHeight: 550,  prefix: 'data-eq-', expectedAttributes: ['data-eq-at-s-height',    'data-eq-from-xxs-height', 'data-eq-from-xs-height', 'data-eq-from-s-height', 'data-eq-to-s-height',   'data-eq-to-m-height',   'data-eq-to-l-height',    'data-eq-to-xl-height',    'data-eq-to-xxl-height',    'data-eq-to-xxxl-height']},
          { actualHeight: 599,  prefix: 'data-eq-', expectedAttributes: ['data-eq-at-s-height',    'data-eq-from-xxs-height', 'data-eq-from-xs-height', 'data-eq-from-s-height', 'data-eq-to-s-height',   'data-eq-to-m-height',   'data-eq-to-l-height',    'data-eq-to-xl-height',    'data-eq-to-xxl-height',    'data-eq-to-xxxl-height']},
          { actualHeight: 600,  prefix: 'data-eq-', expectedAttributes: ['data-eq-at-m-height',    'data-eq-from-xxs-height', 'data-eq-from-xs-height', 'data-eq-from-s-height', 'data-eq-from-m-height', 'data-eq-to-m-height',   'data-eq-to-l-height',    'data-eq-to-xl-height',    'data-eq-to-xxl-height',    'data-eq-to-xxxl-height']},
          { actualHeight: 1650, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-xxxl-height', 'data-eq-from-xxs-height', 'data-eq-from-xs-height', 'data-eq-from-s-height', 'data-eq-from-m-height', 'data-eq-from-l-height', 'data-eq-from-xl-height', 'data-eq-from-xxl-height', 'data-eq-from-xxxl-height', 'data-eq-to-xxxl-height']},
        ];

        const allAttributes = [
          'to-xxs-height',
          'to-xs-height',
          'to-s-height',
          'to-m-height',
          'to-l-height',
          'to-xl-height',
          'to-xxl-height',
          'to-xxxl-height',
          'from-xxs-height',
          'from-xs-height',
          'from-s-height',
          'from-m-height',
          'from-l-height',
          'from-xl-height',
          'from-xxl-height',
          'from-xxxl-height',
          'at-xxs-height',
          'at-xs-height',
          'at-s-height',
          'at-m-height',
          'at-l-height',
          'at-xl-height',
          'at-xxl-height',
          'at-xxxl-height',
        ];

        cases.forEach(({ actualHeight, expectedAttributes, prefix }) => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/restrict-template-expressions
          test(`height ${actualHeight}, prefix ${prefix}`, async function (this: TestContextCustom, assert) {
            this.actualHeight = actualHeight;
            this.prefix = prefix;

            let allAttributesEffective = allAttributes;
            if (prefix) {
              allAttributesEffective = allAttributesEffective.map((attr) => prefix + attr);
            }

            const missingAttributes = allAttributesEffective.filter(
              (attr) => !expectedAttributes?.includes(attr)
            );

            await render(hbs`
              {{! template-lint-disable no-inline-styles style-concatenation }}
              <div
                id="test-subject"
                style="width: 300px; height: {{this.actualHeight}}px;"
                {{element-query prefix=this.prefix sizesHeight=true sizes=false}}
              >
              </div>
            `);

            const element = find('#test-subject') as HTMLElement | null;
            if (!element) throw new Error('Expected element to exist');

            m = 'Element is rendered';
            assert.ok(true, m);

            for (const attr of expectedAttributes) {
              await waitUntil(() => element.getAttribute(attr) != null);

              m = `Attribute ${attr} is expected to exist on the element`;
              assert.ok(true, m);
            }

            for (const attr of missingAttributes) {
              await waitUntil(() => element.getAttribute(attr) == null);

              m = `Attribute ${attr} is expected NOT to exist on the element`;
              assert.ok(true, m);
            }
          });
        });
      });

      module('custom sizes', function (/* hooks */) {
        const sizesHeight = { 'small-height': 0, 'medium-height': 300, 'large-height': 700 };

        // prettier-ignore
        const cases = [
          { actualHeight: 299,                     expectedAttributes: ['at-small-height',  'from-small-height', 'to-small-height',    'to-medium-height',  'to-large-height']},
          { actualHeight: 0,                       expectedAttributes: ['at-small-height',  'from-small-height', 'to-small-height',    'to-medium-height',  'to-large-height']},
          { actualHeight: 150,                     expectedAttributes: ['at-small-height',  'from-small-height', 'to-small-height',    'to-medium-height',  'to-large-height']},
          { actualHeight: 300,                     expectedAttributes: ['at-medium-height', 'from-small-height', 'from-medium-height', 'to-medium-height',  'to-large-height']},
          { actualHeight: 450,                     expectedAttributes: ['at-medium-height', 'from-small-height', 'from-medium-height', 'to-medium-height',  'to-large-height']},
          { actualHeight: 699,                     expectedAttributes: ['at-medium-height', 'from-small-height', 'from-medium-height', 'to-medium-height',  'to-large-height']},
          { actualHeight: 700,                     expectedAttributes: ['at-large-height',  'from-small-height', 'from-medium-height', 'from-large-height', 'to-large-height']},
          { actualHeight: 299, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-small-height',  'data-eq-from-small-height', 'data-eq-to-small-height',    'data-eq-to-medium-height',  'data-eq-to-large-height']},
          { actualHeight: 0,   prefix: 'data-eq-', expectedAttributes: ['data-eq-at-small-height',  'data-eq-from-small-height', 'data-eq-to-small-height',    'data-eq-to-medium-height',  'data-eq-to-large-height']},
          { actualHeight: 150, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-small-height',  'data-eq-from-small-height', 'data-eq-to-small-height',    'data-eq-to-medium-height',  'data-eq-to-large-height']},
          { actualHeight: 300, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-medium-height', 'data-eq-from-small-height', 'data-eq-from-medium-height', 'data-eq-to-medium-height',  'data-eq-to-large-height']},
          { actualHeight: 450, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-medium-height', 'data-eq-from-small-height', 'data-eq-from-medium-height', 'data-eq-to-medium-height',  'data-eq-to-large-height']},
          { actualHeight: 699, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-medium-height', 'data-eq-from-small-height', 'data-eq-from-medium-height', 'data-eq-to-medium-height',  'data-eq-to-large-height']},
          { actualHeight: 700, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-large-height',  'data-eq-from-small-height', 'data-eq-from-medium-height', 'data-eq-from-large-height', 'data-eq-to-large-height']},
        ];

        const allAttributes = [
          'at-small-height',
          'at-medium-height',
          'at-large-height',
          'from-small-height',
          'from-medium-height',
          'from-large-height',
          'to-small-height',
          'to-medium-height',
          'to-large-height',
        ];

        cases.forEach(({ actualHeight, expectedAttributes, prefix }) => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/restrict-template-expressions
          test(`height ${actualHeight}, prefix: ${prefix}`, async function (this: TestContextCustom, assert) {
            this.actualHeight = actualHeight;
            this.sizesHeight = sizesHeight;
            this.prefix = prefix;

            let allAttributesEffective = allAttributes;
            if (prefix) {
              allAttributesEffective = allAttributesEffective.map((attr) => prefix + attr);
            }

            const missingAttributes = allAttributesEffective.filter(
              (attr) => !expectedAttributes?.includes(attr)
            );

            await render(hbs`
              {{! template-lint-disable no-inline-styles style-concatenation }}
              <div
                id="test-subject"
                style="width: 300px; height: {{this.actualHeight}}px;"
                {{element-query sizesHeight=this.sizesHeight prefix=this.prefix sizes=false}}
              >
              </div>
            `);

            const element = find('#test-subject') as HTMLElement | null;
            if (!element) throw new Error('Expected element to exist');

            m = 'Element is rendered';
            assert.ok(true, m);

            for (const attr of expectedAttributes) {
              await waitUntil(() => element.getAttribute(attr) != null);

              m = `Attribute ${attr} is expected to exist on the element`;
              assert.ok(true, m);
            }

            for (const attr of missingAttributes) {
              await waitUntil(() => element.getAttribute(attr) == null);

              m = `Attribute ${attr} is expected NOT to exist on the element`;
              assert.ok(true, m);
            }
          });
        });
      });
    });

    module('dimension both', function (/* hooks */) {
      module('default sizes', function (/* hooks */) {
        // prettier-ignore
        const cases = [
          { actualDimension: 1,                        expectedAttributes: ['at-xxs',  'from-xxs', 'to-xxs',  'to-xs',  'to-s',   'to-m',   'to-l',    'to-xl',    'to-xxl',    'to-xxxl', 'at-xxs-height',  'from-xxs-height', 'to-xxs-height',  'to-xs-height',  'to-s-height',   'to-m-height',   'to-l-height',    'to-xl-height',    'to-xxl-height',    'to-xxxl-height']},
          { actualDimension: 400,                      expectedAttributes: ['at-s',    'from-xxs', 'from-xs', 'from-s', 'to-s',   'to-m',   'to-l',    'to-xl',    'to-xxl',    'to-xxxl', 'at-s-height',    'from-xxs-height', 'from-xs-height', 'from-s-height', 'to-s-height',   'to-m-height',   'to-l-height',    'to-xl-height',    'to-xxl-height',    'to-xxxl-height']},
          { actualDimension: 550,                      expectedAttributes: ['at-s',    'from-xxs', 'from-xs', 'from-s', 'to-s',   'to-m',   'to-l',    'to-xl',    'to-xxl',    'to-xxxl', 'at-s-height',    'from-xxs-height', 'from-xs-height', 'from-s-height', 'to-s-height',   'to-m-height',   'to-l-height',    'to-xl-height',    'to-xxl-height',    'to-xxxl-height']},
          { actualDimension: 599,                      expectedAttributes: ['at-s',    'from-xxs', 'from-xs', 'from-s', 'to-s',   'to-m',   'to-l',    'to-xl',    'to-xxl',    'to-xxxl', 'at-s-height',    'from-xxs-height', 'from-xs-height', 'from-s-height', 'to-s-height',   'to-m-height',   'to-l-height',    'to-xl-height',    'to-xxl-height',    'to-xxxl-height']},
          { actualDimension: 600,                      expectedAttributes: ['at-m',    'from-xxs', 'from-xs', 'from-s', 'from-m', 'to-m',   'to-l',    'to-xl',    'to-xxl',    'to-xxxl', 'at-m-height',    'from-xxs-height', 'from-xs-height', 'from-s-height', 'from-m-height', 'to-m-height',   'to-l-height',    'to-xl-height',    'to-xxl-height',    'to-xxxl-height']},
          { actualDimension: 1650,                     expectedAttributes: ['at-xxxl', 'from-xxs', 'from-xs', 'from-s', 'from-m', 'from-l', 'from-xl', 'from-xxl', 'from-xxxl', 'to-xxxl', 'at-xxxl-height', 'from-xxs-height', 'from-xs-height', 'from-s-height', 'from-m-height', 'from-l-height', 'from-xl-height', 'from-xxl-height', 'from-xxxl-height', 'to-xxxl-height']},
          { actualDimension: 1,    prefix: 'data-eq-', expectedAttributes: ['data-eq-at-xxs',  'data-eq-from-xxs', 'data-eq-to-xxs',  'data-eq-to-xs',  'data-eq-to-s',   'data-eq-to-m',   'data-eq-to-l',    'data-eq-to-xl',    'data-eq-to-xxl',    'data-eq-to-xxxl', 'data-eq-at-xxs-height',  'data-eq-from-xxs-height', 'data-eq-to-xxs-height',  'data-eq-to-xs-height',  'data-eq-to-s-height',   'data-eq-to-m-height',   'data-eq-to-l-height',    'data-eq-to-xl-height',    'data-eq-to-xxl-height',    'data-eq-to-xxxl-height']},
          { actualDimension: 400,  prefix: 'data-eq-', expectedAttributes: ['data-eq-at-s',    'data-eq-from-xxs', 'data-eq-from-xs', 'data-eq-from-s', 'data-eq-to-s',   'data-eq-to-m',   'data-eq-to-l',    'data-eq-to-xl',    'data-eq-to-xxl',    'data-eq-to-xxxl', 'data-eq-at-s-height',    'data-eq-from-xxs-height', 'data-eq-from-xs-height', 'data-eq-from-s-height', 'data-eq-to-s-height',   'data-eq-to-m-height',   'data-eq-to-l-height',    'data-eq-to-xl-height',    'data-eq-to-xxl-height',    'data-eq-to-xxxl-height']},
          { actualDimension: 550,  prefix: 'data-eq-', expectedAttributes: ['data-eq-at-s',    'data-eq-from-xxs', 'data-eq-from-xs', 'data-eq-from-s', 'data-eq-to-s',   'data-eq-to-m',   'data-eq-to-l',    'data-eq-to-xl',    'data-eq-to-xxl',    'data-eq-to-xxxl', 'data-eq-at-s-height',    'data-eq-from-xxs-height', 'data-eq-from-xs-height', 'data-eq-from-s-height', 'data-eq-to-s-height',   'data-eq-to-m-height',   'data-eq-to-l-height',    'data-eq-to-xl-height',    'data-eq-to-xxl-height',    'data-eq-to-xxxl-height']},
          { actualDimension: 599,  prefix: 'data-eq-', expectedAttributes: ['data-eq-at-s',    'data-eq-from-xxs', 'data-eq-from-xs', 'data-eq-from-s', 'data-eq-to-s',   'data-eq-to-m',   'data-eq-to-l',    'data-eq-to-xl',    'data-eq-to-xxl',    'data-eq-to-xxxl', 'data-eq-at-s-height',    'data-eq-from-xxs-height', 'data-eq-from-xs-height', 'data-eq-from-s-height', 'data-eq-to-s-height',   'data-eq-to-m-height',   'data-eq-to-l-height',    'data-eq-to-xl-height',    'data-eq-to-xxl-height',    'data-eq-to-xxxl-height']},
          { actualDimension: 600,  prefix: 'data-eq-', expectedAttributes: ['data-eq-at-m',    'data-eq-from-xxs', 'data-eq-from-xs', 'data-eq-from-s', 'data-eq-from-m', 'data-eq-to-m',   'data-eq-to-l',    'data-eq-to-xl',    'data-eq-to-xxl',    'data-eq-to-xxxl', 'data-eq-at-m-height',    'data-eq-from-xxs-height', 'data-eq-from-xs-height', 'data-eq-from-s-height', 'data-eq-from-m-height', 'data-eq-to-m-height',   'data-eq-to-l-height',    'data-eq-to-xl-height',    'data-eq-to-xxl-height',    'data-eq-to-xxxl-height']},
          { actualDimension: 1650, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-xxxl', 'data-eq-from-xxs', 'data-eq-from-xs', 'data-eq-from-s', 'data-eq-from-m', 'data-eq-from-l', 'data-eq-from-xl', 'data-eq-from-xxl', 'data-eq-from-xxxl', 'data-eq-to-xxxl', 'data-eq-at-xxxl-height', 'data-eq-from-xxs-height', 'data-eq-from-xs-height', 'data-eq-from-s-height', 'data-eq-from-m-height', 'data-eq-from-l-height', 'data-eq-from-xl-height', 'data-eq-from-xxl-height', 'data-eq-from-xxxl-height', 'data-eq-to-xxxl-height']},
        ];

        const allAttributes = [
          'to-xxs',
          'to-xs',
          'to-s',
          'to-m',
          'to-l',
          'to-xl',
          'to-xxl',
          'to-xxxl',
          'from-xxs',
          'from-xs',
          'from-s',
          'from-m',
          'from-l',
          'from-xl',
          'from-xxl',
          'from-xxxl',
          'at-xxs',
          'at-xs',
          'at-s',
          'at-m',
          'at-l',
          'at-xl',
          'at-xxl',
          'at-xxxl',
          'to-xxs-height',
          'to-xs-height',
          'to-s-height',
          'to-m-height',
          'to-l-height',
          'to-xl-height',
          'to-xxl-height',
          'to-xxxl-height',
          'from-xxs-height',
          'from-xs-height',
          'from-s-height',
          'from-m-height',
          'from-l-height',
          'from-xl-height',
          'from-xxl-height',
          'from-xxxl-height',
          'at-xxs-height',
          'at-xs-height',
          'at-s-height',
          'at-m-height',
          'at-l-height',
          'at-xl-height',
          'at-xxl-height',
          'at-xxxl-height',
        ];

        cases.forEach(({ actualDimension, expectedAttributes, prefix }) => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/restrict-template-expressions
          test(`dimensions ${actualDimension}, prefix ${prefix}`, async function (this: TestContextCustom, assert) {
            this.actualWidth = actualDimension;
            this.actualHeight = actualDimension;
            this.prefix = prefix;

            let allAttributesEffective = allAttributes;
            if (prefix) {
              allAttributesEffective = allAttributesEffective.map((attr) => prefix + attr);
            }

            const missingAttributes = allAttributesEffective.filter(
              (attr) => !expectedAttributes?.includes(attr)
            );

            await render(hbs`
              {{! template-lint-disable no-inline-styles style-concatenation }}
              <div
                id="test-subject"
                style="width: {{this.actualWidth}}px; height: {{this.actualHeight}}px;"
                {{element-query prefix=this.prefix sizesHeight=true}}
              >
              </div>
            `);

            const element = find('#test-subject') as HTMLElement | null;
            if (!element) throw new Error('Expected element to exist');

            m = 'Element is rendered';
            assert.ok(true, m);

            for (const attr of expectedAttributes) {
              await waitUntil(() => element.getAttribute(attr) != null);

              m = `Attribute ${attr} is expected to exist on the element`;
              assert.ok(true, m);
            }

            for (const attr of missingAttributes) {
              await waitUntil(() => element.getAttribute(attr) == null);

              m = `Attribute ${attr} is expected NOT to exist on the element`;
              assert.ok(true, m);
            }
          });
        });
      });

      module('custom sizes', function (/* hooks */) {
        const sizesHeight = { 'small-height': 0, 'medium-height': 300, 'large-height': 700 };

        // prettier-ignore
        const cases = [
          { actualHeight: 299,                     expectedAttributes: ['at-small-height',  'from-small-height', 'to-small-height',    'to-medium-height',  'to-large-height']},
          { actualHeight: 0,                       expectedAttributes: ['at-small-height',  'from-small-height', 'to-small-height',    'to-medium-height',  'to-large-height']},
          { actualHeight: 150,                     expectedAttributes: ['at-small-height',  'from-small-height', 'to-small-height',    'to-medium-height',  'to-large-height']},
          { actualHeight: 300,                     expectedAttributes: ['at-medium-height', 'from-small-height', 'from-medium-height', 'to-medium-height',  'to-large-height']},
          { actualHeight: 450,                     expectedAttributes: ['at-medium-height', 'from-small-height', 'from-medium-height', 'to-medium-height',  'to-large-height']},
          { actualHeight: 699,                     expectedAttributes: ['at-medium-height', 'from-small-height', 'from-medium-height', 'to-medium-height',  'to-large-height']},
          { actualHeight: 700,                     expectedAttributes: ['at-large-height',  'from-small-height', 'from-medium-height', 'from-large-height', 'to-large-height']},
          { actualHeight: 299, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-small-height',  'data-eq-from-small-height', 'data-eq-to-small-height',    'data-eq-to-medium-height',  'data-eq-to-large-height']},
          { actualHeight: 0,   prefix: 'data-eq-', expectedAttributes: ['data-eq-at-small-height',  'data-eq-from-small-height', 'data-eq-to-small-height',    'data-eq-to-medium-height',  'data-eq-to-large-height']},
          { actualHeight: 150, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-small-height',  'data-eq-from-small-height', 'data-eq-to-small-height',    'data-eq-to-medium-height',  'data-eq-to-large-height']},
          { actualHeight: 300, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-medium-height', 'data-eq-from-small-height', 'data-eq-from-medium-height', 'data-eq-to-medium-height',  'data-eq-to-large-height']},
          { actualHeight: 450, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-medium-height', 'data-eq-from-small-height', 'data-eq-from-medium-height', 'data-eq-to-medium-height',  'data-eq-to-large-height']},
          { actualHeight: 699, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-medium-height', 'data-eq-from-small-height', 'data-eq-from-medium-height', 'data-eq-to-medium-height',  'data-eq-to-large-height']},
          { actualHeight: 700, prefix: 'data-eq-', expectedAttributes: ['data-eq-at-large-height',  'data-eq-from-small-height', 'data-eq-from-medium-height', 'data-eq-from-large-height', 'data-eq-to-large-height']},
        ];

        const allAttributes = [
          'at-small',
          'at-medium',
          'at-large',
          'from-small',
          'from-medium',
          'from-large',
          'to-small',
          'to-medium',
          'to-large',
        ];

        cases.forEach(({ actualHeight, expectedAttributes, prefix }) => {
          // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/restrict-template-expressions
          test(`height ${actualHeight}, prefix: ${prefix}`, async function (this: TestContextCustom, assert) {
            this.actualHeight = actualHeight;
            this.sizesHeight = sizesHeight;
            this.prefix = prefix;

            let allAttributesEffective = allAttributes;
            if (prefix) {
              allAttributesEffective = allAttributesEffective.map((attr) => prefix + attr);
            }

            const missingAttributes = allAttributesEffective.filter(
              (attr) => !expectedAttributes?.includes(attr)
            );

            await render(hbs`
              {{! template-lint-disable no-inline-styles style-concatenation }}
              <div
                id="test-subject"
                style="width: 300px; height: {{this.actualHeight}}px;"
                {{element-query sizesHeight=this.sizesHeight prefix=this.prefix sizes=null}}
              >
              </div>
            `);

            const element = find('#test-subject') as HTMLElement | null;
            if (!element) throw new Error('Expected element to exist');

            m = 'Element is rendered';
            assert.ok(true, m);

            for (const attr of expectedAttributes) {
              await waitUntil(() => element.getAttribute(attr) != null);

              m = `Attribute ${attr} is expected to exist on the element`;
              assert.ok(true, m);
            }

            for (const attr of missingAttributes) {
              await waitUntil(() => element.getAttribute(attr) == null);

              m = `Attribute ${attr} is expected NOT to exist on the element`;
              assert.ok(true, m);
            }
          });
        });
      });
    });
  });
});
