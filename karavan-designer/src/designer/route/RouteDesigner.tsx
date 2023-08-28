/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, {useCallback, useEffect, useRef} from 'react';
import {
    Drawer,
    DrawerPanelContent,
    DrawerContent,
    DrawerContentBody,
    Button
} from '@patternfly/react-core';
import '../karavan.css';
import {DslSelector} from "./DslSelector";
import {DslProperties} from "./DslProperties";
import {DslConnections} from "./DslConnections";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {DslElement} from "./DslElement";
import {CamelUi} from "../utils/CamelUi";
import {useRouteDesignerHook} from "./useRouteDesignerHook";
import {useConnectionsStore, useDesignerStore, useIntegrationStore, useSelectorStore} from "../KaravanStore";
import {shallow} from "zustand/shallow";
import useResizeObserver from "./useResizeObserver";
import {Command, EventBus} from "../utils/EventBus";
import useMutationsObserver from "./useDrawerMutationsObserver";
import {DeleteConfirmation} from "./DeleteConfirmation";

export function RouteDesigner() {

    const {openSelector, createRouteConfiguration, onCommand, handleKeyDown, handleKeyUp, unselectElement} = useRouteDesignerHook();

    const [integration] = useIntegrationStore((state) => [state.integration], shallow)
    const [showDeleteConfirmation, setPosition, width, height, top, left, hideLogDSL] = useDesignerStore((s) =>
        [s.showDeleteConfirmation, s.setPosition, s.width, s.height, s.top, s.left, s.hideLogDSL], shallow)

    const [showSelector] = useSelectorStore((s) => [s.showSelector], shallow)

    const [clearSteps] = useConnectionsStore((s) => [s.clearSteps], shallow)

    const onChangeGraphSize = useCallback((target: HTMLDivElement)  => {
        changeGraphSize();
    }, [])

    function changeGraphSize ()  {
        if (flowRef && flowRef.current) {
            const el = flowRef.current;
            const rect = el.getBoundingClientRect();
            setPosition(rect.width, rect.height, rect.top, rect.left)
        }
    }

    const firstRef = useResizeObserver(onChangeGraphSize);
    const secondRef = useMutationsObserver(onChangeGraphSize);
    const printerRef = useRef<HTMLDivElement | null>(null);
    const flowRef = useRef<HTMLDivElement | null>(null);

    useEffect(()=> {
        // window.addEventListener('resize', changeGraphSize);
        const interval = setInterval(() => {
            changeGraphSize();
        }, 500);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        const commandSub = EventBus.onCommand()?.subscribe((command: Command) => onCommand(command, printerRef));
        if (flowRef.current === null) {
            clearSteps();
        } else {
            changeGraphSize();
        }
        return ()=> {
            clearInterval(interval)
            // window.removeEventListener('resize', changeGraphSize);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            commandSub?.unsubscribe();
        }
    }, [showSelector, integration])

    function getPropertiesPanel() {
        return (
            <DrawerPanelContent style={{transform: "initial"}} isResizable hasNoBorder defaultSize={'400px'}
                                maxSize={'800px'} minSize={'300px'}>
                <DslProperties isRouteDesigner={true}/>
            </DrawerPanelContent>
        )
    }

    function getGraph() {
        const routes = CamelUi.getRoutes(integration);
        const routeConfigurations = CamelUi.getRouteConfigurations(integration);
        return (
            <div className="graph" ref={printerRef}>
                <DslConnections/>
                <div id="flows"
                     className="flows"
                     data-click="FLOWS"
                     onClick={event => {unselectElement(event)}}
                     ref={flowRef}>
                    {routeConfigurations?.map((routeConfiguration, index: number) => (
                        <DslElement key={routeConfiguration.uuid}
                                    inSteps={false}
                                    position={index}
                                    step={routeConfiguration}
                                    parent={undefined}/>
                    ))}
                    {routes?.map((route: any, index: number) => (
                        <DslElement key={route.uuid}
                                    inSteps={false}
                                    position={index}
                                    step={route}
                                    parent={undefined}/>
                    ))}
                    <div className="add-flow">
                        <Button
                            variant={routes.length === 0 ? "primary" : "secondary"}
                            icon={<PlusIcon/>}
                            onClick={e => {
                                openSelector(undefined, undefined)
                            }}
                        >
                            Create route
                        </Button>
                        <Button
                            variant="secondary"
                            icon={<PlusIcon/>}
                            onClick={e => createRouteConfiguration()}
                        >
                            Create configuration
                        </Button>
                    </div>
                </div>
            </div>)
    }

    const hasFlows = integration?.spec?.flows?.length && integration?.spec?.flows?.length > 0;
    return (
        <div className="dsl-page" ref={firstRef}>
            <div className="dsl-page-columns" ref={secondRef}>
                <Drawer isExpanded isInline>
                    <DrawerContent panelContent={getPropertiesPanel()}>
                        <DrawerContentBody>{hasFlows && getGraph()}</DrawerContentBody>
                    </DrawerContent>
                </Drawer>
            </div>
            {showSelector && <DslSelector/>}
            {showDeleteConfirmation && <DeleteConfirmation/>}
        </div>
    )
}