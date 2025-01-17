import * as alt from 'alt-server';
import { AgendaSystem } from '../../server/systems/agenda';
import { PluginSystem } from '../../server/systems/plugins';
import { ATHENA_EXAMPLE_AGENDA } from '../../shared-plugins/example-agenda/enums';

const PLUGIN_NAME = 'Agenda - Athena Logo Example';

function showAthenaLogo(player: alt.Player) {
    alt.emitClient(player, ATHENA_EXAMPLE_AGENDA.SHOW);
    alt.setTimeout(() => {
        if (!player || !player.valid) {
            return;
        }

        alt.emitClient(player, ATHENA_EXAMPLE_AGENDA.CLOSE);
        AgendaSystem.goNext(player);
    }, 2000);
}

PluginSystem.registerPlugin(PLUGIN_NAME, () => {
    alt.log(`~lg~${PLUGIN_NAME} was Loaded`);
    AgendaSystem.set(0, showAthenaLogo);
});
