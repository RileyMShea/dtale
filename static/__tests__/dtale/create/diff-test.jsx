import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../../test-utils";

import { clickBuilder } from "./create-test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

function submit(res) {
  res.find("div.modal-footer").first().find("button").first().simulate("click");
}

describe("DataViewer tests", () => {
  let result, CreateColumn, CreateDiff;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1205,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 775,
    });

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    mockChartJS();

    jest.mock("popsicle", () => mockBuildLibs);
  });

  beforeEach(async () => {
    CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;
    CreateDiff = require("../../../popups/create/CreateDiff").CreateDiff;
    const { DataViewer } = require("../../../dtale/DataViewer");

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tick();
    clickMainMenuButton(result, "Build Column");
    await tickUpdate(result);
    clickBuilder(result, "Row Difference");
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  });

  it("DataViewer: build row difference column", async () => {
    expect(result.find(CreateDiff).length).toBe(1);
    result.find(CreateDiff).find(Select).first().instance().onChange({ value: "col1" });
    result
      .find(CreateDiff)
      .find("div.form-group")
      .at(1)
      .find("input")
      .simulate("change", { target: { value: "4" } });
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      periods: "4",
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_diff");
  });

  it("DataViewer: build row difference cfg validation", () => {
    const { validateDiffCfg } = require("../../../popups/create/CreateDiff");
    expect(validateDiffCfg({})).toBe("Please select a column!");
    expect(
      validateDiffCfg({
        col: "col1",
        periods: "a",
      })
    ).toBe("Please select a valid value for periods!");
    expect(
      validateDiffCfg({
        col: "col1",
        periods: "1",
      })
    ).toBeNull();
  });
});
