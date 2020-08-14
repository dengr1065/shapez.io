import { enumDirection, Vector } from "../../core/vector";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { Entity } from "../entity";
import { MetaBuilding } from "../meta_building";
import { GameRoot } from "../root";
import { LightComponent } from "../components/light";

export class MetaLightBuilding extends MetaBuilding {
    constructor() {
        super("light");
    }

    getSilhouetteColor() {
        return "#8a5cff";
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        // @todo
        return true;
    }

    isRotateable() {
        return false;
    }

    getDimensions() {
        return new Vector(1, 1);
    }

    getSprite() {
        return null;
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
                        direction: enumDirection.top,
                        type: enumPinSlotType.logicalAcceptor,
                    },
                ],
            })
        );

        entity.addComponent(new LightComponent({}));
    }
}
