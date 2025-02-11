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

import * as React from 'react';
import {useFilesStore, useFileStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {TopologyTab} from "../../topology/TopologyTab";
import {useEffect} from "react";
import {IntegrationFile} from "../../topology/TopologyStore";
import {CreateFileModal} from "../files/CreateFileModal";

export const ProjectTopologyTab: React.FC = () => {

    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [files] = useFilesStore((s) => [s.files], shallow);

    useEffect(() => {
        // console.log(files.map(f => f.name));
        // setFiles(files.map(f => new IntegrationFile(f.name, f.code)));
    }, []);


    function selectFile(fileName: string) {
        const file = files.filter(f => f.name === fileName)?.at(0);
        if (file) {
            setFile('select', file);
        }
    }

    return (
        <>
            <TopologyTab
                hideToolbar={false}
                files={files.map(f => new IntegrationFile(f.name, f.code))}
                onClickCreateButton={() => setFile('create')}
                onSetFile={(fileName) => selectFile(fileName)}
            />
            <CreateFileModal types={['INTEGRATION']} isKameletsProject={false}/>
        </>
    );
}