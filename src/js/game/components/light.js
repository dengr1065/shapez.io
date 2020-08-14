import { Component } from "../component";
import { enumColors } from "../colors";

export class LightComponent extends Component {
    static getId() {
        return "Light";
    }

    duplicateWithoutContents() {
        return new LightComponent({});
    }

    /**
     * @param {object} param0
     * @param {import("../colors").enumColors=} param0.color
     */
    constructor({ color = enumColors.uncolored }) {
        super();
        this.color = color;
    }
}
