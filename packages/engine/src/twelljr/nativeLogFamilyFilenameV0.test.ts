import { describe, expect, it } from "vitest";
import {
  inferNativeBinaryTimeLikeArtifactFromFilename,
  inferNativeTextLogArtifactFromFilename,
} from "./nativeLogFamilyFilenameV0.js";

describe("nativeLogFamilyFilenameV0", () => {
  it("classifies Time / Dtld / Bptn / Poor binary names", () => {
    expect(inferNativeBinaryTimeLikeArtifactFromFilename("TimeKHJY.log")).toEqual({
      artifactKind: "time_binary_v0",
      timeLogSuffix: "KHJY",
    });
    expect(inferNativeBinaryTimeLikeArtifactFromFilename("DtldKTKN.log")).toEqual({
      artifactKind: "dtld_binary_v0",
      timeLogSuffix: "KTKN",
    });
    expect(inferNativeBinaryTimeLikeArtifactFromFilename("BptnKNJ.log")).toEqual({
      artifactKind: "bptn_binary_v0",
      timeLogSuffix: "KNJ",
    });
    expect(inferNativeBinaryTimeLikeArtifactFromFilename("PoorKTWZ.log")).toEqual({
      artifactKind: "poor_binary_v0",
      timeLogSuffix: "KTWZ",
    });
    expect(inferNativeBinaryTimeLikeArtifactFromFilename("Past.log")).toBeNull();
  });
  it("classifies text log names", () => {
    expect(inferNativeTextLogArtifactFromFilename("Past.log")).toEqual({
      artifactKind: "past_txt_v0",
      timeLogSuffix: null,
    });
    expect(inferNativeTextLogArtifactFromFilename("Boot.txt")).toEqual({
      artifactKind: "boot_txt_v0",
      timeLogSuffix: null,
    });
    expect(inferNativeTextLogArtifactFromFilename("DtldKHJY.log")).toEqual({
      artifactKind: "dtld_txt_v0",
      timeLogSuffix: "KHJY",
    });
    expect(inferNativeTextLogArtifactFromFilename("ComJR.twl")).toEqual({
      artifactKind: "twl_slot_txt_v0",
      timeLogSuffix: null,
    });
    expect(inferNativeTextLogArtifactFromFilename("C:\\slot\\0.twl")).toEqual({
      artifactKind: "twl_slot_txt_v0",
      timeLogSuffix: null,
    });
  });
});
