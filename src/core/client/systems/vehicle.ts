import * as alt from 'alt-client';
import * as native from 'natives';

import { KEY_BINDS } from '../../shared/enums/keyBinds';
import { SYSTEM_EVENTS } from '../../shared/enums/system';
import { VEHICLE_EVENTS } from '../../shared/enums/vehicle';
import { PED_CONFIG_FLAG } from '../../shared/flags/pedflags';
import { KeybindController } from '../events/keyup';
import { isAnyMenuOpen } from '../utility/menus';

import './push';
import { PushVehicle } from './push';

export class VehicleController {
    /**
     * Register the default vehicle keybinds.
     * @static
     * @memberof VehicleController
     */
    static registerKeybinds() {
        KeybindController.registerKeybind({
            key: KEY_BINDS.VEHICLE_ENGINE,
            singlePress: VehicleController.emitEngine,
        });

        KeybindController.registerKeybind({
            key: KEY_BINDS.VEHICLE_LOCK,
            singlePress: VehicleController.emitLock,
        });
    }

    /**
     * Starts / stops the engine.
     * @static
     * @memberof VehicleController
     */
    static emitEngine() {
        if (isAnyMenuOpen()) {
            return;
        }

        if (!alt.Player.local.vehicle) {
            return;
        }

        alt.emitServer(VEHICLE_EVENTS.SET_ENGINE);
    }

    /**
     * Toggles lock from locked / unlocked.
     * @static
     * @memberof VehicleController
     */
    static emitLock() {
        if (isAnyMenuOpen()) {
            return;
        }

        alt.emitServer(VEHICLE_EVENTS.SET_LOCK);
    }

    /**
     * Prevents seat shuffling and engine control.
     * @static
     * @memberof VehicleController
     */
    static enterVehicle() {
        native.setPedConfigFlag(alt.Player.local.scriptID, PED_CONFIG_FLAG.DISABLE_SEAT_SHUFFLE, true);
        native.setPedConfigFlag(alt.Player.local.scriptID, PED_CONFIG_FLAG.DISABLE_STARTING_VEHICLE_ENGINE, true);
        native.setPedConfigFlag(alt.Player.local.scriptID, PED_CONFIG_FLAG.DISABLE_STOPPING_VEHICLE_ENGINE, true);
    }

    /**
     * Warps the local player into the vehicle.
     * @static
     * @memberof VehicleController
     */
    static async setIntoVehicle(vehicle: alt.Vehicle, seat: number) {
        const isVehicleReady = await new Promise((resolve: Function) => {
            let attempts = 0;

            const interval = alt.setInterval(() => {
                attempts += 1;

                if (attempts >= 100) {
                    alt.clearInterval(interval);
                    resolve(false);
                    return;
                }

                if (!vehicle.valid) {
                    return;
                }

                alt.clearInterval(interval);
                resolve(true);
            }, 200);
        });

        if (!isVehicleReady) {
            return;
        }

        native.setPedIntoVehicle(alt.Player.local.scriptID, vehicle.scriptID, seat);
    }

    /**
     * Prevents a pedestrian from flying out of a vehicle window.
     * @static
     * @param {boolean} [value=true]
     * @memberof VehicleController
     */
    static enableSeatBelt(value: boolean = true) {
        const seatBeltStatus = value ? false : true;
        native.setPedConfigFlag(alt.Player.local.scriptID, PED_CONFIG_FLAG.CAN_FLY_THROUGH_WINDSHIELD, seatBeltStatus);
    }

    static handleVehicleDisables() {
        if (!alt.Player.local || !alt.Player.local.valid) {
            return;
        }

        let isLocked = false;
        if (alt.Player.local.vehicle) {
            isLocked = native.getVehicleDoorLockStatus(alt.Player.local.vehicle.scriptID) === 2;
        }

        // Prevent Window Breaking. It's annoying.
        const vehicle = native.getVehiclePedIsTryingToEnter(alt.Player.local.scriptID);
        const enteringLockedVehicle = native.isPedTryingToEnterALockedVehicle(alt.Player.local.scriptID);
        const isWindowFixed = native.isVehicleWindowIntact(vehicle, 0);

        if (native.doesEntityExist(vehicle) && enteringLockedVehicle && isWindowFixed) {
            native.clearPedTasksImmediately(alt.Player.local.scriptID);
        }

        const isDead = alt.Player.local.meta.isDead;
        const isPushing = PushVehicle.isPushing();
        if (!isDead && !isLocked && !isPushing) {
            return;
        }

        native.disableControlAction(0, 23, true); // F - Enter
        native.disableControlAction(0, 75, true); // F - Exit
    }

    static toggleEngine(status: boolean) {
        if (!alt.Player.local.scriptID) {
            return;
        }

        native.setVehicleEngineOn(alt.Player.local.vehicle, status, false, false);
    }
}

alt.onServer(VEHICLE_EVENTS.SET_SEATBELT, VehicleController.enableSeatBelt);
alt.onServer(VEHICLE_EVENTS.SET_INTO, VehicleController.setIntoVehicle);
alt.onServer(SYSTEM_EVENTS.VEHICLE_ENGINE, VehicleController.toggleEngine);
alt.onceServer(SYSTEM_EVENTS.TICKS_START, VehicleController.registerKeybinds);
alt.on('enteredVehicle', VehicleController.enterVehicle);
