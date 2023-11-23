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

import {Navigate, Route, Routes} from 'react-router-dom';
import React, {useEffect, useRef} from "react";
import {KaravanApi} from "../api/KaravanApi";
import {
    Flex,
    FlexItem,
    Page,
} from "@patternfly/react-core";
import {ProjectsPage} from "../projects/ProjectsPage";
import {ProjectPage} from "../project/ProjectPage";
import {EmbedEditor} from "../project/file/EmbedEditor";
import {EmbedTopology} from "../project/topology/EmbedTopology";
import {ServicesPage} from "../services/ServicesPage";
import {ContainersPage} from "../containers/ContainersPage";
import {KnowledgebasePage} from "../knowledgebase/KnowledgebasePage";
import {SsoApi} from "../api/SsoApi";
import {useAppConfigStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {PageNavigation} from "./PageNavigation";
import {useMainHook} from "./useMainHook";
import {TemplatesPage} from "../templates/TemplatesPage";
import {Notification} from "../designer/utils/Notification";
import {MainLoader} from "./MainLoader";

export function Main() {

    const [readiness, setReadiness] = useAppConfigStore((s) => [s.readiness, s.setReadiness], shallow)
    const {getData, getStatuses} = useMainHook();

    const initialized = useRef(false)

    useEffect(() => {
        console.log("Main");
        if (!initialized.current) {
            initialized.current = true
            effect()
        }
        const interval = setInterval(() => {
            KaravanApi.getReadiness((r: any) => {
                setReadiness(r);
            })
        }, 10000)
        return () => {
            clearInterval(interval);
        };
    }, [])

    function effect() {
        console.log("Main effect start");
        KaravanApi.getAuthType((authType: string) => {
            console.log("authType", authType);
            if (authType === 'oidc') {
                SsoApi.auth(() => {
                    KaravanApi.getMe((user: any) => {
                        getData();
                    });
                });
            }
            getData();
        });
        return () => {
            console.log("Main effect end");
        };
    }

    function showSpinner() {
        return KaravanApi.authType === undefined || readiness === undefined;
    }

    function showStepper() {
        return readiness !== undefined && readiness.status !== true;
    }

    function showMain() {
        return !showStepper() && !showSpinner() && (KaravanApi.isAuthorized || KaravanApi.authType === 'public');
    }

    return (
        <Page className="karavan">
            {!showMain() && <MainLoader/>}
            {showMain() &&
                <Flex direction={{default: "row"}} style={{width: "100%", height: "100%"}}
                      alignItems={{default: "alignItemsStretch"}} spaceItems={{default: 'spaceItemsNone'}}>
                    <FlexItem style={{display:"none"}}>
                        {<PageNavigation/>}
                    </FlexItem>
                    <FlexItem flex={{default: "flex_2"}} style={{height: "100%"}}>
                        <Routes>
                            {/*<Route path="/dashboard" element={<DashboardPage key={'dashboard'}/>}/>*/}
                            <Route path="/projects" element={<ProjectsPage key={'projects'}/>}/>
                            <Route path="/projects/:projectId" element={<ProjectPage key={'project'}/>}/>
                            <Route path="/templates" element={<TemplatesPage key={'templates'}/>}/>
                            <Route path="/services" element={<ServicesPage key="services"/>}/>
                            <Route path="/containers" element={<ContainersPage key="services"/>}/>
                            <Route path="/knowledgebase" element={<KnowledgebasePage dark={false}/>}/>
														<Route path="/topology/:projectId" element={<EmbedTopology key={'topology'}/>}/>
														<Route path="/designer/:projectId/:fileName" element={<EmbedEditor key={'designer'}/>}/>
                            <Route path="*" element={<Navigate to="/projects" replace/>}/>
                        </Routes>
                    </FlexItem>
                </Flex>
            }
            <Notification/>
        </Page>
    );
};
