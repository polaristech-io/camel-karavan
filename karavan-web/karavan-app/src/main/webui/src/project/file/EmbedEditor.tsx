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
import React, {useEffect} from 'react';
import '../../designer/karavan.css';
import Editor from "@monaco-editor/react";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {ProjectFile} from "../../api/ProjectModels";
import {KaravanApi} from '../../api/KaravanApi';
import {useFilesStore, useFileStore} from "../../api/ProjectStore";
import {KaravanDesigner} from "../../designer/KaravanDesigner";
import {ProjectService} from "../../api/ProjectService";
import {shallow} from "zustand/shallow";
import {useParams} from "react-router-dom";

export function EmbedEditor () {

    let {projectId,fileName} = useParams();
		
    const [file, operation] = useFileStore((state) => [state.file, state.operation], shallow )
    const [setFile] = useFileStore((s) => [s.setFile], shallow);

		function loadData(project: any){
			KaravanApi.getFiles(project, (files: ProjectFile[]) => {
					useFilesStore.setState({files: files});
					if(fileName){
						setFile('select', files.find((_file) => _file.name == fileName));
					}
			});
		}
    useEffect(() => {
			loadData(projectId);
    }, []);
		
    function save (name: string, code: string) {
        if (file) {
            file.code = code;
            ProjectService.saveFile(file, true);
        }
    }

    function onGetCustomCode (name: string, javaType: string): Promise<string | undefined> {
        const files = useFilesStore.getState().files;
        return new Promise<string | undefined>(resolve => resolve(files.filter(f => f.name === name + ".java")?.at(0)?.code));
    }

    function getDesigner (project: any) {
        return (
            file !== undefined &&
            <KaravanDesigner
                showCodeTab={true}
                dark={false}
                filename={file.name}
                yaml={file.code}
                onSave={(name, yaml) => save(name, yaml)}
                onSaveCustomCode={(name, code) =>
                    ProjectService.saveFile(new ProjectFile(name + ".java", project, code, Date.now()), false)}
                onGetCustomCode={onGetCustomCode}
            />
        )
    }

    const isCamelYaml = file !== undefined && file.name.endsWith(".camel.yaml");
    const isKameletYaml = file !== undefined && file.name.endsWith(".kamelet.yaml");
    const isIntegration = isCamelYaml && file?.code && CamelDefinitionYaml.yamlIsIntegration(file.code);
    const showDesigner = (isCamelYaml && isIntegration) || isKameletYaml;
    return (
        <>
            {showDesigner && getDesigner(projectId)}
        </>
    )
}
