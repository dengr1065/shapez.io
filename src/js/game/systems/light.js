import { GameSystemWithFilter } from "../game_system_with_filter";
import { LightComponent } from "../components/light";
import { BOOL_TRUE_SINGLETON, BOOL_FALSE_SINGLETON } from "../items/boolean_item";
import { MapChunkView } from "../map_chunk_view";
import { globalConfig } from "../../core/config";
import { ColorItem } from "../items/color_item";
import { enumColorsToHexCode, enumColors } from "../colors";

export class LightSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [LightComponent]);
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];

            const lightComp = entity.components.Light;
            const network = entity.components.WiredPins.slots[0].linkedNetwork;

            if (network === null) continue;
            const signal = network.currentValue;

            if (signal instanceof ColorItem) {
                lightComp.color = signal.color;
                continue;
            }

            if (signal.equals(BOOL_TRUE_SINGLETON)) {
                lightComp.color = enumColors.red;
            } else if (signal.equals(BOOL_FALSE_SINGLETON)) {
                lightComp.color = enumColors.white;
            } else {
                lightComp.color = enumColors.uncolored;
            }
        }
    }

    /**
     * Draws a given chunk
     * @param {import("../../core/draw_utils").DrawParameters} parameters
     * @param {MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.contents;
        for (let y = 0; y < globalConfig.mapChunkSize; ++y) {
            for (let x = 0; x < globalConfig.mapChunkSize; ++x) {
                const entity = contents[x][y];

                if (entity && entity.components.Light) {
                    const origin = entity.components.StaticMapEntity.origin;

                    parameters.context.fillStyle = enumColorsToHexCode[entity.components.Light.color];
                    parameters.context.beginRoundedRect(
                        origin.x * globalConfig.tileSize + 5,
                        origin.y * globalConfig.tileSize + 5,
                        globalConfig.tileSize - 10,
                        globalConfig.tileSize - 10,
                        4
                    );

                    parameters.context.fill();
                }
            }
        }
    }
}
