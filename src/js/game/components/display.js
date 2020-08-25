import { Component } from "../component";
import { BaseItem } from "../base_item";

export class DisplayComponent extends Component {
    static getId() {
        return "Display";
    }

    static getSchema() {
        return {};
    }

    duplicateWithoutContents() {
        return new DisplayComponent({});
    }

    /**
     * @param {object} param0
     * @param {BaseItem=} param0.lastItem
     */
    constructor({ lastItem = null }) {
        super();
        this.lastItem = lastItem;
    }
}
