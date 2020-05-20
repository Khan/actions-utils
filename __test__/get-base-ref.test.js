// @-flow

const { validateBaseRef } = require("../get-base-ref");

describe("validateBaseRef", () => {
  it("should accept HEAD", () => {
    expect(validateBaseRef("HEAD")).toEqual("HEAD");
  });
  it("should translate a remote branch", () => {
    expect(validateBaseRef("an-example-remote-branch")).toEqual(
      `refs/remotes/origin/an-example-remote-branch`
    );
  });

  const { GITHUB_BASE_REF } = process.env;
  if (GITHUB_BASE_REF) {
    // Skip this test, because the remote environment isn't finding local `master`
  } else {
    it("should accept a local branch", () => {
      expect(validateBaseRef("master")).toEqual("master");
    });
  }
});
