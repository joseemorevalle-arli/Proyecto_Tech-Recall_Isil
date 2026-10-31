import { test } from "node:test";
import assert from "node:assert/strict";
import { countCues, isAllowedVttUrl } from "./vtt.ts";

const VTT_URL = "https://isil-pe.zoom.us/rec/play/vtt?type=transcript&meetingId=abc";

test("acepta la URL del VTT que sirve Zoom de ISIL", () => {
  assert.equal(isAllowedVttUrl(VTT_URL), true);
});

test("rechaza URLs que no son https, otro dominio o un dominio que solo lo imita", () => {
  const rejected = [
    "http://isil-pe.zoom.us/rec/play/vtt?type=transcript",
    "https://evil.com/rec/play/vtt?type=transcript",
    "https://isil-pe.zoom.us.evil.com/rec/play/vtt?type=transcript",
    "https://isil-pe.zoom.us@evil.com/rec/play/vtt?type=transcript",
    "https://isil-pe.zoom.us:8443/rec/play/vtt?type=transcript",
    "https://isil-pe.zoom.us/otra/ruta",
    "https://127.0.0.1/rec/play/vtt",
    "no es una url",
    "",
  ];
  for (const url of rejected) {
    assert.equal(isAllowedVttUrl(url), false, url);
  }
});

test("cuenta las intervenciones de un VTT", () => {
  const vtt = [
    "WEBVTT",
    "",
    "1",
    "00:00:01.000 --> 00:00:04.000",
    "Hola a todos",
    "",
    "2",
    "00:00:04.500 --> 00:00:08.000",
    "Empezamos con la unidad 1",
    "",
  ].join("\n");
  assert.equal(countCues(vtt), 2);
});

test("un VTT solo con encabezado no tiene intervenciones", () => {
  assert.equal(countCues("WEBVTT\n\n"), 0);
  assert.equal(countCues("WEBVTT\r\n\r\n"), 0);
});
