import React, {useEffect, useState} from 'react';
import {
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    TextInput,
    PageSection,
    TextContent,
    Text,
    Button,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateIcon,
    Spinner, EmptyStateHeader, Flex, FlexItem
} from '@patternfly/react-core';
import '../designer/karavan.css';
import RefreshIcon from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import {
    Tbody,
    Td,
    Th,
    Thead,
    Tr
} from '@patternfly/react-table';
import {
    Table
} from '@patternfly/react-table/deprecated';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import {ProjectsTableRow} from "./ProjectsTableRow";
import {DeleteProjectModal} from "./DeleteProjectModal";
import {CreateProjectModal} from "./CreateProjectModal";
import {useProjectsStore, useProjectStore} from "../api/ProjectStore";
import {ProjectService} from "../api/ProjectService";
import {MainToolbar} from "../designer/MainToolbar";
import {Project, ProjectType} from "../api/ProjectModels";
import {shallow} from "zustand/shallow";
import {PageNavigation} from "../main/PageNavigation";
import {DashboardPage} from "../dashboard/DashboardPage";
import {ProjectPage} from "../project/ProjectPage";
import {ServicesPage} from "../services/ServicesPage";
import {ContainersPage} from "../containers/ContainersPage";
import {KnowledgebasePage} from "../knowledgebase/KnowledgebasePage";


export const ProjectsPage = () => {

    const [projects] = useProjectsStore((state) => [state.projects], shallow)
    const [operation] = useProjectStore((state) => [state.operation], shallow)
    const [filter, setFilter] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if (projects.length === 0) setLoading(true);
            if (!["create", "delete", "select", "copy"].includes(operation)) {
                refresh();
            }
        }, 1300);
        return () => {
            clearInterval(interval)
        };
    }, [operation]);

    function refresh() {
        ProjectService.refreshProjects();
        ProjectService.refreshAllDeploymentStatuses();
        ProjectService.refreshAllContainerStatuses();
        setLoading(false);
    }

    function getTools() {
        return <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <ToolbarItem>
                    <Button variant="link" icon={<RefreshIcon/>} onClick={e => {
                        setLoading(true);
                        refresh();
                    }}/>
                </ToolbarItem>
                <ToolbarItem>
                    <TextInput className="text-field" type="search" id="search" name="search"
                               autoComplete="off" placeholder="Search by name"
                               value={filter}
                               onChange={(_, e) => setFilter(e)}/>
                </ToolbarItem>
                <ToolbarItem>
                    <Button icon={<PlusIcon/>}
                            onClick={e =>
                                useProjectStore.setState({operation: "create", project: new Project()})}
                    >Create</Button>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>
    }

    function title() {
        return <TextContent>
            <Text component="h2">Projects</Text>
        </TextContent>
    }

    function getEmptyState() {
        return (
            <Tr>
                <Td colSpan={8}>
                    <Bullseye>
                        {loading &&
                            <Spinner className="progress-stepper" diameter="80px" aria-label="Loading..."/>}
                        {!loading &&
                            <EmptyState variant={EmptyStateVariant.sm}>
                                <EmptyStateHeader titleText="No results found"
                                                  icon={<EmptyStateIcon icon={SearchIcon}/>} headingLevel="h2"/>
                            </EmptyState>
                        }
                    </Bullseye>
                </Td>
            </Tr>
        )
    }

    function getProjectsTable() {
        const projs = projects
            .filter(p => p.type === ProjectType.normal)
            .filter(p => p.name.toLowerCase().includes(filter) || p.description.toLowerCase().includes(filter));
        return (
            <Table aria-label="Projects" variant={"compact"}>
                <Thead>
                    <Tr>
                        <Th key='type'>Runtime</Th>
                        <Th key='projectId'>Project ID</Th>
                        <Th key='name'>Name</Th>
                        <Th key='description'>Description</Th>
                        <Th key='commit'>Commit</Th>
                        <Th key='deployment'>Environment</Th>
                        <Th key='action'></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {projs.map(project => (
                        <ProjectsTableRow
                            key={project.projectId}
                            project={project}/>
                    ))}
                    {projs.length === 0 && getEmptyState()}
                </Tbody>
            </Table>
        )
    }

    return (
        <PageSection className="kamelet-section projects-page" padding={{default: 'noPadding'}}>
            <PageSection className="tools-section" padding={{default: 'noPadding'}}>
                <MainToolbar title={title()} tools={getTools()}/>
            </PageSection>
            <PageSection isFilled className="kamelets-page">
                {getProjectsTable()}
            </PageSection>
            {["create", "copy"].includes(operation) && <CreateProjectModal/>}
            {["delete"].includes(operation) && <DeleteProjectModal/>}
        </PageSection>

    )
}