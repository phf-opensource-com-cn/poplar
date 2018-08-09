import {Annotator, AnnotatorConfig, RenderBehaviourOptions} from "../Annotator/Annotator";
import {TestDataSourceLong} from "./TestDataSourceLong";

let element = document.createElement("div");
document.body.appendChild(element);

(window as any).annotator = new Annotator(new TestDataSourceLong(), element, new AnnotatorConfig(RenderBehaviourOptions.ONE_SHOT, 80));
