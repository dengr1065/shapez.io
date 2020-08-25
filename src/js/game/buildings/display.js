import { enumDirection, Vector } from "../../core/vector";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { Entity } from "../entity";
import { MetaBuilding } from "../meta_building";
import { GameRoot } from "../root";
import { DisplayComponent } from "../components/display";
import { BOOL_TRUE_SINGLETON } from "../items/boolean_item";
import { enumColorsToHexCode, enumColors } from "../colors";
import { ColorItem } from "../items/color_item";

export class MetaDisplayBuilding extends MetaBuilding {
    constructor() {
        super("display");
    }

    /**
     * @param {Entity?} entity
     */
    getSilhouetteColor(entity) {
        if (entity) {
            const pinsComp = entity.components.WiredPins;
            const network = pinsComp.slots[0].linkedNetwork;

            if (network && network.currentValue) {
                if (network.currentValue.equals(BOOL_TRUE_SINGLETON)) {
                    return enumColorsToHexCode[enumColors.white];
                }

                if (network.currentValue instanceof ColorItem) {
                    return enumColorsToHexCode[network.currentValue.color];
                }
            }
        }

        return "#aaaaaa";
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        // @todo
        return true;
    }

    getDimensions() {
        return new Vector(1, 1);
    }

    getShowWiresLayerPreview() {
        return true;
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(
            new WiredPinsComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ],
            })
        );
        entity.addComponent(new DisplayComponent({}));
    }
}
