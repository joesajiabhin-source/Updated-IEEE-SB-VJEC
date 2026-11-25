// Customized Elastic Lettering. Use with package 0.1.0-prototype.1.
import { configurationContract as contract } from "./src/configuration.js";

const saved = {
  "mediaProvenance": [],
  "assetId": "elastic-lettering",
  "assetVersion": "0.1.0-prototype.1",
  "configurationSchemaVersion": 1,
  "values": {
    "text": "tweak it",
    "width": 1440,
    "height": 720,
    "ink": "#ffffff",
    "stretch": 1,
    "bounce": 0.65,
    "stagger": 100
  }
};
if (saved.assetId !== contract.templateId || saved.configurationSchemaVersion !== contract.schemaVersion) throw new Error("Settings do not match this asset configuration contract.");
const values = contract.normalize(saved.values);
if (JSON.stringify(values) !== JSON.stringify(saved.values)) throw new Error("Settings are invalid for this package. Export them again.");
export default contract.toRuntimeOptions(values);
