import { AwtrixLight } from '../../main';
import { DefaultApp } from '../adapter-config';
import { AwtrixApi } from '../api';

export namespace AppType {
    export abstract class AbstractApp {
        protected apiClient: AwtrixApi.Client;
        protected adapter: AwtrixLight;
        private definition: DefaultApp;

        public constructor(apiClient: AwtrixApi.Client, adapter: AwtrixLight, definition: DefaultApp) {
            this.apiClient = apiClient;
            this.adapter = adapter;
            this.definition = definition;

            adapter.on('stateChange', this.onStateChange.bind(this));
            adapter.on('objectChange', this.onObjectChange.bind(this));
        }

        public getName(): string {
            return this.definition.name;
        }

        public async init(): Promise<void> {
            
        }

        public async createObjects(prefix: string): Promise<void> {
            const appName = this.getName();

            await this.adapter.setObjectNotExistsAsync(`${prefix}.${appName}.visible`, {
                type: 'state',
                common: {
                    name: {
                        en: 'Visible',
                        de: 'Sichtbar',
                        ru: 'Видимый',
                        pt: 'Visível',
                        nl: 'Vertaling',
                        fr: 'Visible',
                        it: 'Visibile',
                        es: 'Visible',
                        pl: 'Widoczny',
                        //uk: 'Вибрані',
                        'zh-cn': '不可抗辩',
                    },
                    type: 'boolean',
                    role: 'switch.enable',
                    read: true,
                    write: true,
                    def: true,
                },
                native: {
                    name: appName,
                },
            });
        }

        public async unloadAsync(): Promise<void> {
            if (this.adapter.config.removeAppsOnStop) {
                this.adapter.log.info(`[onUnload] Deleting app on awtrix light with name "${this.definition.name}"`);

                try {
                    await this.apiClient.removeAppAsync(this.definition.name).catch((error) => {
                        this.adapter.log.warn(`Unable to remove unknown app "${this.definition.name}": ${error}`);
                    });
                } catch (error) {
                    this.adapter.log.error(`[onUnload] Unable to delete app ${this.definition.name}: ${error}`);
                }
            }
        }

        private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
            const idNoNamespace = this.adapter.removeNamespace(id);
            const appName = this.getName();

            // Handle default states for all apps
            if (id && state && !state.ack) {
                if (idNoNamespace == `apps.${appName}.visible`) {
                    this.adapter.log.debug(`changing visibility of app ${appName} to ${state.val}`);

                    await this.adapter.setStateAsync(idNoNamespace, { val: state.val, ack: true, c: 'onStateChange' });
                }
            }

            await this.stateChanged(id, state);
        }

        protected async stateChanged(id: string, state: ioBroker.State | null | undefined): Promise<void> {
            // override
        }

        private async onObjectChange(id: string, obj: ioBroker.Object | null | undefined): Promise<void> {
            await this.objectChanged(id, obj);
        }

        protected async objectChanged(id: string, obj: ioBroker.Object | null | undefined): Promise<void> {
            // override
        }
    }
}