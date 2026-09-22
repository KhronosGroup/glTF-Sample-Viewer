<template>
    <!-- UI -->
    <div class="canvasUIMaximize">
        <img v-bind:src="[uiVisible ? 'assets/ui/Icon_Expand.svg' : 'assets/ui/Icon_Collapse.svg']"
            @click="toggleUI()" ref="fullscreenIcon" class="maximizeCanvasIcon" width="30px"
            v-show='!(isMobile && tabContentHidden === false) && !noUI'
            >
    </div>
    <div class="column" v-show='uiVisible'>
            <!--Drop Area -->
            <div v-bind:class="[showDropDownOverlay ? '' : 'is-hidden']" id="dropZone"
                style="pointer-events: none;">
                <div class="is-overlay is-dropAreaCard is-flex" style="z-index: 999;">
                    <div class="box has-text-centered">
                        <span class="icon is-large">
                            <i class="fas fa-folder-open fa-4x"></i>
                        </span>
                        <p class="is-size-2 has-text-weight-light">
                            Drag and drop files here
                        </p>
                        <p class="is-size-4">
                            Supported files: glTF, glb & hdr
                        </p>
                    </div>
                </div>
            </div>
            <!-- Tabs -->
            <b-tabs id="tabsContainer" 
                vertical position="is-right" 
                v-model="activeTabIndex"
                v-bind:class="[tabContentHidden ? 'is-flex-wrap-nowrap hideTabs tabsContainer' : 'is-flex-wrap-nowrap tabsContainer']" 
                type="is-toggle" v-bind:animated="false">

                <!-- Tab Category: Models -->
                <b-tab-item label="Models" icon="google-photos" class="tab-item tabItemScrollable" :order="0" title-item-class="d-none">

                    <!-- Tab Header -->
                    <template #header  >
                        <div id="test-id" @click="collapseActiveTab($event, 0)"
                            v-bind:style="[tabContentHidden === false && activeTab === 0 ? {'height': '100%'} : {}]"
                            v-bind:width="[isMobile ? '200px' : '100px']"
                            >
                            <!-- to get colored icons use: https://stackoverflow.com/a/43916743 -->
                            <img v-bind:src="[tabContentHidden === false && activeTab === 0 ? 'assets/ui/Model 50X50.svg' : 'assets/ui/Model 30X30.svg']"
                                v-bind:style="[tabContentHidden === false && activeTab === 0 ? {'height': '100%'} : {}]">
                            <span
                              
                                v-show='isMobile === false && (tabContentHidden === true || activeTab !== 0)'>
                                Models
                            </span>
                        </div>
                    </template>

                    <!-- Tab Content: Models -->
                    <div class="tabContent">
                        <img src="assets/ui/Navigation_right_20px.svg" class="tabNavigationIcon" width="30px"
                            @click="collapseActiveTab($event, 0)">
                        <h2 class="title is-spaced">Models</h2>
                        <b-field label="Models" class="subtitle">
                            <b-select v-model="selectedModel" v-on:input="modelChanged.next($event.target.value);">
                                <option v-for="(item) in models" v-bind:value="item">
                                    {{ item }}
                                </option>
                            </b-select>
                        </b-field>
                        <b-field label="Flavor">
                            <b-select v-model="selectedFlavour" v-on:input="flavourChanged.next($event.target.value)">
                                <option v-for="(item) in flavours" v-bind:value="item">
                                    {{ item }}
                                </option>
                            </b-select>
                        </b-field>
                        <b-field label="Scenes" class="subtitle">
                            <b-select v-model="selectedScene" v-on:input="sceneChanged.next($event.target.value)">
                                <option v-for="(item) in scenes" v-bind:value="item.index">
                                    {{ item.title }}
                                </option>
                            </b-select>
                        </b-field>
                        <b-field label="Cameras" class="subtitle">
                            <b-select v-model="selectedCamera" v-on:input="cameraChanged.next(parseInt($event.target.value))">
                                <option v-for="(item) in cameras" v-bind:value="item.index">
                                    {{ item.title }}
                                </option>
                            </b-select>
                        </b-field>

                        <b-field label="Variants" class="subtitle"
                            v-bind:style="[materialVariants.length <= 1 ? {'display': 'none'} : {}]">
                            <b-field v-for="item in materialVariants" v-bind:key="item"
                                v-bind:style="[materialVariants.length > 5 ? {'display': 'none'} : {}]">
                                <b-radio v-bind:native-value="item" v-on:input="variantChanged.next($event.target.value)"
                                    v-model="selectedVariant">
                                    {{ item }}
                                </b-radio>
                            </b-field>
                            <b-select v-model="selectedVariant" v-on:input="variantChanged.next($event.target.value)"
                                v-bind:style="[materialVariants.length > 5 ? {} : {'display': 'none'}]">
                                <option v-for="(item) in materialVariants" v-bind:value="item">
                                    {{ item }}
                                </option>
                            </b-select>
                        </b-field>
                    </div>
                </b-tab-item>


                <b-tab-item label="Display" icon="library-music" class="tabItemScrollable tab-item" :order="1">
                    <template #header>
                        <div @click="collapseActiveTab($event, 1)"
                            v-bind:style="[tabContentHidden === false && activeTab === 1 ? {'height': '100%'} : {}]">
                            <!-- to get colored icons use: https://stackoverflow.com/a/43916743 -->
                            <img v-bind:src="[tabContentHidden === false && activeTab === 1 ? 'assets/ui/Display 50X50.svg' : 'assets/ui/Display 30X30.svg']"
                                v-bind:width="[tabContentHidden === false && activeTab === 1 ? '50px' : '30px']"
                                v-bind:style="[tabContentHidden === false && activeTab === 1 ? {'height': '100%'} : {}]">
                            <span
                                v-show='isMobile === false && (tabContentHidden === true || activeTab !== 1)'>
                                Display
                            </span>
                        </div>
                    </template>

                    <div class="tabContent">
                        <img src="assets/ui/Navigation_right_20px.svg" class="tabNavigationIcon" width="30px"
                            @click="collapseActiveTab($event, 1)">
                        <h2 class="title  is-spaced">Display</h2>
                        <b-field label="Lighting" class="subtitle">
                            <b-switch class="smallerLabel" v-model="ibl" v-on:input="iblChanged.next($event.target.checked); iblTriggered($event.target.checked);">Image Based
                            </b-switch>
                            <b-switch class="smallerLabel" v-model="punctualLights" v-on:input="punctualLightsChanged.next($event.target.checked)">Punctual
                                Lighting</b-switch>
                        </b-field>
                        <b-field label="IBL Intensity" class="smallerLabel">
                            <b-slider rounded v-model="iblIntensity" :min="-2" v-bind:max="5" :step=0.01 :custom-formatter="val => Math.round(Math.pow(10,val)*100.0)/100.0"
                                class="iblIntensitySlider" v-on:dragging="iblIntensityChanged.next($event)">
                                <b-slider-tick :value="-2" class="iblIntensitySliderMarker">0.01</b-slider-tick>
                                <b-slider-tick :value="0" class="iblIntensitySliderMarker">1</b-slider-tick>
                                <b-slider-tick :value="2" class="iblIntensitySliderMarker">100</b-slider-tick>                               
                                <b-slider-tick :value="4" class="iblIntensitySliderMarker">10000</b-slider-tick>
                            </b-slider>
                        </b-field>
                        <b-field class="subtitle"  label="Exposure"></b-field>
                        <b-slider rounded v-model="exposureSetting" :min="21" v-bind:max="-6" :step=0.1 
                        :custom-formatter="val => Math.round((1.0 / Math.pow(2.0, val))*100000)/100000" class="exposureSlider" ticks v-on:dragging="exposureChanged.next($event)">
                            <b-slider-tick :value="-6" class="exposureSliderMarker">64</b-slider-tick>
                            <b-slider-tick :value="0" class="exposureSliderMarker">1</b-slider-tick>
                            <b-slider-tick :value="9.966" class="exposureSliderMarker">0.001</b-slider-tick>
                            <b-slider-tick :value="21" class="exposureSliderMarker">0</b-slider-tick>

                        </b-slider>
                        </b-field>

                        <b-field label="Tone Map" class="subtitle">
                            <b-select v-on:input="tonemapChanged.next($event.target.value)" v-model="toneMap">
                                <option v-for="(item) in tonemaps" v-bind:value="item.title">
                                    {{ item.title }}
                                </option>
                            </b-select>
                        </b-field>
                        <b-field label="Background" class="subtitle">
                            <b-switch class="smallerLabel" v-model="renderEnv" v-on:input="renderEnvChanged.next($event.target.checked)" v-bind:disabled="ibl === false ? true : false">Environment
                                Map</b-switch>
                            <b-switch class="smallerLabel" v-model="blurEnv" v-on:input="blurEnvChanged.next($event.target.checked)"
                                v-bind:disabled="ibl === false ? true : false">Blur</b-switch>
                            <b-field label="Background Color" class="smallerLabel"></b-field>
                            <b-input type="color" id="clearColorPicker" custom-class="colorInput"
                            v-on:input="colorChanged.next($event.target.value)" v-model="clearColor"></b-input>
                        </b-field>
                        <b-field label="Environment Rotation" class="smallerLabel">
                            <b-select v-on:input="environmentRotationChanged.next($event.target.value)"
                                v-model="selectedEnvironmentRotation">
                                <option v-for="(item) in environmentRotations" v-bind:value="item.title">
                                    {{ item.title }}
                                </option>
                            </b-select>
                        </b-field>

                        <b-field label="Image Based Lighting" class="subtitle">
                            <button class="button is-rounded">
                                <input class="file-input" type="file" accept=".hdr" @change="onFileChange">
                                <i class="fas fa-plus"></i>
                                Add New HDR
                            </button>

                            <b-field label="Active Environment" class="subtitle">
                                <b-dropdown aria-role="list" v-model="selectedEnvironment" v-on:change="selectedEnvironmentChanged.next($event)">
                                    <template #trigger="{ active }">
                                        <b-button rounded type="is-primary"
                                            :icon-right="active ? 'menu-up' : 'menu-down'">
                                            {{ environments[selectedEnvironment].title }}
                                        </b-button>
                                    </template>

                                    <b-dropdown-item aria-role="listitem" v-for="name in Object.keys(environments)"
                                        v-bind:key="name" :value="name">
                                        {{ environments[name].title }}
                                    </b-dropdown-item>
                                </b-dropdown>
                            </b-field>
                        </b-field>
                        <div class="pb-6"></div>
                    </div>
                </b-tab-item>

                <b-tab-item label="Validator" icon="video" class="tabItemScrollable tab-item" :order="2">
                    <template #header>
                        <div @click="collapseActiveTab($event, 2)"
                        v-bind:style="[tabContent === false && activeTab === 2 ? {'height': '100%'} : {}]">
                        <!-- to get colored icons use: https://stackoverflow.com/a/43916743 -->
                        <div style="max-width:fit-content; margin-left: auto; margin-right: auto;" v-html="getValidationCounter()"></div>
                        <span
                        v-show='isMobile === false && (tabContentHidden === true || activeTab !== 2)'>
                        Validator
                        </span>
                       
                    </div>
                    </template>

                    <div class="tabContent" style="display: flex; flex-direction: column; height: inherit;">
                        <img src="assets/ui/Navigation_right_20px.svg" class="tabNavigationIcon" width="30px"
                            @click="collapseActiveTab($event, 2)">
                        <h2 class="title is-spaced" v-bind:data="validationReport">glTF Validator</h2>
                            <div class="modelCredit" v-show='validationReport?.error === undefined'>
                                <p>Number of errors: {{validationReport?.issues?.numErrors ?? 0}}</p>
                                <p>Number of warnings: {{validationReport?.issues?.numWarnings ?? 0}}</p>
                                <p>Number of infos: {{validationReport?.issues?.numInfos ?? 0}}</p>
                            </div>

                            <div v-show='validationReportDescription.message !== undefined && validationReportDescription?.message !== ""'>
                                <p style="margin-top: 10px; margin-bottom: 10px; font-size:smaller;">{{validationReportDescription?.message}}</p>
                            </div>

                            <div v-show="validationReport?.error !== undefined">
                                <p style="margin-top: 10px; margin-bottom: 10px; color:red;">{{validationReport?.error}}</p>
                            </div>

                            <button v-show="validationReport?.error === undefined" class="button is-rounded" style="width: fit-content; flex-shrink: 0; margin-bottom: 12px;" v-on:click="copyToClipboard(JSON.stringify(validationReport, undefined, 4))">Copy</button>
                            <button v-show="validationReport?.error === undefined" class="button is-rounded" style="width: fit-content; flex-shrink: 0;" v-on:click="downloadJSON(validationReport?.uri?.substring(validationReport?.uri?.lastIndexOf('/') + 1) + '.report.json', validationReport)">Download</button>
                            <span style="margin-top: 5px;">Powered by <a href="https://github.com/KhronosGroup/glTF-Validator" target="_blank" rel="noopener noreferrer">glTF-Validator</a></span>
                        </b-field>
                    </div>
                </b-tab-item>



                <!-- Animations tab - shown when no interactivity graphs are available -->
                <b-tab-item label="Animations" icon="video" class="tabItemScrollable tab-item" :order="3">
                    <template #header>
                        <div @click="collapseActiveTab($event, 3)"
                            v-bind:style="[tabContentHidden === false && activeTab === 3 ? {'height': '100%'} : {}]">
                            <img v-bind:src="[tabContentHidden === false && activeTab === 3 ? 'assets/ui/Animation 50X50.svg' : 'assets/ui/Animation 30X30.svg']"
                                v-bind:width="[tabContentHidden === false && activeTab === 3 ? '50px' : '30px']"
                                v-bind:style="[tabContentHidden === false && activeTab === 3 ? {'height': '100%'} : {}]">
                            <span v-show='isMobile === false && (tabContentHidden === true || activeTab !== 3 )' v-if="!showGraphsTab">
                                Animations
                            </span>
                            <span v-show='isMobile === false && (tabContentHidden === true || activeTab !== 3 )' v-if="showGraphsTab">
                                Graphs
                            </span>
                        </div>
                    </template>

                    <div class="tabContent" v-if="!showGraphsTab">
                        <img src="assets/ui/Navigation_right_20px.svg" class="tabNavigationIcon" width="30px"
                            @click="collapseActiveTab($event, 3)">
                        <h2 class="title is-spaced" style="margin-bottom: 0.5em;">Animations</h2>
                        <label class="subtitle">Animation Controls</label>
                        <!-- Play/Pause and Reset buttons -->
                        <div style="display: flex; gap: 1em; align-items: center; margin-bottom: 1.5em; margin-top: 1em;">
                            <toggle-button v-on:buttonclicked="animationPlayChanged.next($event)" ontext="Pause" offtext="Play"
                                v-model="animationState"
                                v-bind:style="[animations.length == 0 ? {'display': 'none'} : {}]"
                                btn-class="round-green-btn">
                            </toggle-button>
                            <!-- Reset button -->
                            <button class="button is-rounded reset-btn-green" style="border: 1.5px solid #87c540; color: #f2f2f2; background: transparent; min-width: 70px;"
                                v-on:click="animationResetChanged.next($event)" v-bind:style="[animations.length == 0 ? {'display': 'none'} : {}]">
                                Reset
                            </button>
                        </div>
                        <!-- Hide if no animations -->
                        <label class="subtitle" v-bind:style="[animations.length != 0 ? {'display': 'none'} : {}]">No animations available</label>
                        <b-field label="Animations"
                            v-bind:style="[animations.length == 0 ? {'display': 'none'} : {}]">
                            <div v-for="animation in animations" v-bind:key="animation.index" style="margin-bottom: 0.5em;">
                                <b-checkbox v-model="selectedAnimations" :native-value="animation.index"
                                    :disabled="disabledAnimations.includes(animation.index)">
                                    {{ animation.title }}
                                </b-checkbox>
                            </div>
                        </b-field>
                    </div>
                    <div class="tabContent" v-if="showGraphsTab">
                        <img src="assets/ui/Navigation_right_20px.svg" width="30px"
                            @click="collapseActiveTab($event, 3)">
                        <h2 class="title is-spaced" style="margin-bottom: 0.5em;">Interactivity Graphs</h2>
                        <label class="subtitle">Graph Controls</label>
                        <!-- Play/Pause and Reset buttons -->
                        <div style="display: flex; gap: 1em; align-items: center; margin-bottom: 1.5em; margin-top: 1em;">
                            <toggle-button v-on:buttonclicked="graphPlayChanged.next($event)" ontext="Pause" offtext="Play"
                                v-model="graphState"
                                v-bind:style="[graphs.length == 0 ? {'display': 'none'} : {}]"
                                btn-class="round-green-btn">
                            </toggle-button>
                            <!-- Reset button -->
                            <button class="button is-rounded reset-btn-green" style="border: 1.5px solid #87c540; color: #f2f2f2; background: transparent; min-width: 70px;"
                                v-on:click="graphResetChanged.next($event)" v-bind:style="[graphs.length == 0 ? {'display': 'none'} : {}]">
                                Reset
                            </button>
                        </div>
                        <!-- Hide if no graphs -->
                        <label class="subtitle" v-bind:style="[graphs.length != 0 ? {'display': 'none'} : {}]">No graphs available</label>
                        <b-field label="Graphs"
                            v-bind:style="[graphs.length == 0 ? {'display': 'none'} : {}]">
                            <div v-for="graph in graphs" v-bind:key="graph.index" style="margin-bottom: 0.5em;">
                                <b-radio v-model="selectedGraph" :native-value="graph.index">
                                    {{ graph.title }}
                                </b-radio>
                            </div>
                        </b-field>
                        <!-- Custom events subtitle and dropdown -->
                        <div style="margin-top: 2.5em; margin-bottom: 1.5em;" v-if="customEvents.length > 0">
                            <label class="subtitle" style="margin-bottom: 0.5em; display: block;">Custom events</label>
                            <b-field>
                                <b-select v-model="selectedCustomEvent">
                                    <option v-for="event in customEvents" :key="event.id" :value="event.id">
                                        {{ event.id }}
                                    </option>
                                </b-select>
                            </b-field>
                            
                            <!-- Dynamic inputs based on selected custom event -->
                            <form id="customEventForm" v-if="selectedCustomEvent && currentCustomEvent">
                                <div v-for="input in customEventInputs" :key="input.name" style="margin-top: 1em;">
                                    <!-- Boolean switch for bool type -->
                                    <div v-if="input.type === 'bool'" style="display: flex; align-items: center; justify-content: space-between;">
                                        <label class="smallerLabel" style="margin-bottom: 0;">{{ input.name }}</label>
                                        <b-switch v-model="customEventValues[input.name]"></b-switch>
                                    </div>
                                    
                                    <!-- Number input for float type -->
                                    <div v-if="input.type === 'float'">
                                        <label class="smallerLabel" style="display: block; margin-bottom: 0.5em;">{{ input.name }}</label>
                                        <b-field>
                                            <b-input class="longNumberInput" type="number" step="any" v-model.number="customEventValues[input.name]" validation-message="Please enter a valid number" required @focus="customEventFocusedInput = input.name" @blur="customEventFocusedInput = null"></b-input>
                                        </b-field>
                                    </div>
                                    
                                    <!-- Number input (whole) for int type -->
                                    <div v-if="input.type === 'int'">
                                        <label class="smallerLabel" style="display: block; margin-bottom: 0.5em;">{{ input.name }}</label>
                                        <b-field>
                                            <b-input class="longNumberInput" type="text" v-model.number="customEventValues[input.name]" validation-message="Please enter a whole number (e.g. 5)" pattern="[\-]?[0-9]*" required @focus="customEventFocusedInput = input.name" @blur="customEventFocusedInput = null"></b-input>
                                        </b-field>
                                    </div>
                                    
                                    <!-- 2x2 Matrix for float2x2 type -->
                                    <div v-if="input.type === 'float2x2'">
                                        <label class="smallerLabel" style="display: block; margin-bottom: 0.5em;">{{ input.name }}</label>
                                        <b-tooltip :label="String(customEventValues[input.name][customEventFocusedIndex])" :active="customEventFocusedInput === input.name && String(customEventValues[input.name][customEventFocusedIndex]).length > 4" :auto-close="false" style="width: 100%">
                                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.3em; width: max-content;">
                                            <div v-for="col in 2" :key="'col-' + col" style="display: flex; flex-direction: column; gap: 0.3em;">
                                                <div v-for="row in 2" :key="'row-' + row">
                                                        <b-input class="matrixInput" type="number" v-model.number="customEventValues[input.name][(col-1)*2 + (row-1)]" @focus="customEventFocusedInput = input.name; customEventFocusedIndex = (col-1)*2 + (row-1);" @blur="customEventFocusedInput = null" required></b-input>
                                                    </div>
                                                </div>
                                            </div>
                                        </b-tooltip>
                                    </div>
                                    
                                    <!-- 3x3 Matrix for float3x3 type -->
                                    <div v-if="input.type === 'float3x3'">
                                        <label class="smallerLabel" style="display: block; margin-bottom: 0.5em;">{{ input.name }}</label>
                                        <b-tooltip :label="String(customEventValues[input.name][customEventFocusedIndex])" :active="customEventFocusedInput === input.name && String(customEventValues[input.name][customEventFocusedIndex]).length > 4" :auto-close="false" style="width: 100%">
                                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.3em; width: max-content;">
                                            <div v-for="col in 3" :key="'col-' + col" style="display: flex; flex-direction: column; gap: 0.3em;">
                                                <div v-for="row in 3" :key="'row-' + row">
                                                    <b-input class="matrixInput" type="number" v-model.number="customEventValues[input.name][(col-1)*3 + (row-1)]" @focus="customEventFocusedInput = input.name; customEventFocusedIndex = (col-1)*3 + (row-1);" @blur="customEventFocusedInput = null" required></b-input>
                                                </div>
                                            </div>
                                        </div>
                                        </b-tooltip>
                                    </div>
                                    
                                    <!-- 4x4 Matrix for float4x4 type -->
                                    <div v-if="input.type === 'float4x4'">
                                        <label class="smallerLabel" style="display: block; margin-bottom: 0.5em;">{{ input.name }}</label>
                                        <b-tooltip :label="String(customEventValues[input.name][customEventFocusedIndex])" :active="customEventFocusedInput === input.name && String(customEventValues[input.name][customEventFocusedIndex]).length > 4" :auto-close="false" style="width: 100%">
                                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.3em; width: max-content;">
                                            <div v-for="col in 4" :key="'col-' + col" style="display: flex; flex-direction: column; gap: 0.3em;">
                                                <div v-for="row in 4" :key="'row-' + row">
                                                        <b-input class="matrixInput" type="number" v-model.number="customEventValues[input.name][(col-1)*4 + (row-1)]" @focus="customEventFocusedInput = input.name; customEventFocusedIndex = (col-1)*4 + (row-1);" @blur="customEventFocusedInput = null" required></b-input>
                                                    </div>
                                                </div>
                                            </div>
                                        </b-tooltip>
                                    </div>
                                    
                                    <!-- Vector 2 for float2 type -->
                                    <div v-if="input.type === 'float2'">
                                        <label class="smallerLabel" style="display: block; margin-bottom: 0.5em;">{{ input.name }}</label>
                                        <b-tooltip :label="String(customEventValues[input.name][customEventFocusedIndex])" :active="customEventFocusedInput === input.name && String(customEventValues[input.name][customEventFocusedIndex]).length > 4" :auto-close="false" style="width: 100%">
                                        <div style="display: flex; gap: 0.5em;">
                                            <div v-for="(val, idx) in customEventValues[input.name]" :key="'vec2-' + idx">
                                                <b-input class="vectorInput" type="number" v-model.number="customEventValues[input.name][idx]" @focus="customEventFocusedInput = input.name; customEventFocusedIndex = idx;" @blur="customEventFocusedInput = null" required></b-input>
                                            </div>
                                        </div>
                                        </b-tooltip>
                                    </div>
                                    
                                    <!-- Vector 3 for float3 type -->
                                    <div v-if="input.type === 'float3'">
                                        <label class="smallerLabel" style="display: block; margin-bottom: 0.5em;">{{ input.name }}</label>
                                        <b-tooltip :label="String(customEventValues[input.name][customEventFocusedIndex])" :active="customEventFocusedInput === input.name && String(customEventValues[input.name][customEventFocusedIndex]).length > 4" :auto-close="false" style="width: 100%">
                                        <div style="display: flex; gap: 0.5em;">
                                            <div v-for="(val, idx) in customEventValues[input.name]" :key="'vec3-' + idx">
                                                <b-input class="vectorInput" type="number" v-model.number="customEventValues[input.name][idx]" @focus="customEventFocusedInput = input.name; customEventFocusedIndex = idx;" @blur="customEventFocusedInput = null" required></b-input>
                                            </div>
                                        </div>
                                        </b-tooltip>
                                    </div>
                                    
                                    <!-- Vector 4 for float4 type -->
                                    <div v-if="input.type === 'float4'">
                                        <label class="smallerLabel" style="display: block; margin-bottom: 0.5em;">{{ input.name }}</label>
                                        <b-tooltip :label="String(customEventValues[input.name][customEventFocusedIndex])" :active="customEventFocusedInput === input.name && String(customEventValues[input.name][customEventFocusedIndex]).length > 4" :auto-close="false" style="width: 100%">
                                        <div style="display: flex; gap: 0.5em;">
                                            <div v-for="(val, idx) in customEventValues[input.name]" :key="'vec4-' + idx">
                                                <b-input class="vectorInput" type="number" v-model.number="customEventValues[input.name][idx]" @focus="customEventFocusedInput = input.name; customEventFocusedIndex = idx;" @blur="customEventFocusedInput = null" required></b-input>
                                            </div>
                                        </div>
                                        </b-tooltip>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div style="margin-top: 2em; display: flex; justify-content: flex-end;" v-if="selectedCustomEvent">
                            <button class="button is-rounded round-green-btn" v-on:click="sendCustomEvent" :disabled="!customEventValid">
                                Send
                            </button>
                        </div>
                    </div>
                </b-tab-item>

                <!-- Physics tab -->
                <b-tab-item label="Physics" icon="video" class="tabItemScrollable tab-item" v-if="hasPhysics" :order="4">
                    <template #header>
                        <div @click="collapseActiveTab($event, 4)"
                            v-bind:style="[tabContentHidden === false && activeTab === 4 ? {'height': '100%'} : {}]">
                            <img v-bind:src="[tabContentHidden === false && activeTab === 4 ? 'assets/ui/Physics 50X50.svg' : 'assets/ui/Physics 30X30.svg']"
                                v-bind:width="[tabContentHidden === false && activeTab === 4 ? '50px' : '30px']"
                                v-bind:style="[tabContentHidden === false && activeTab === 4 ? {'height': '100%'} : {}]">
                            <span 
                                v-show='isMobile === false && (tabContentHidden === true || activeTab !== 4)'>
                                Physics
                            </span>
                        </div>
                    </template>

                    <div class="tabContent">
                        <img src="assets/ui/Navigation_right_20px.svg" class="tabNavigationIcon" width="30px"
                            @click="collapseActiveTab($event, 4)">
                        <h2 class="title is-spaced" style="margin-bottom: 0.5em;">Physics</h2>
                        <label class="subtitle">Physics Controls</label>
                        
                        <!-- Enable/Disable and Reset buttons -->
                        <div style="display: flex; gap: 1em; align-items: center; margin-bottom: 1.5em; margin-top: 1em;">
                            <toggle-button v-on:buttonclicked="physicsEnabledChanged.next($event)" ontext="Disable" offtext="Enable"
                                v-model="physicsState"
                                btn-class="round-green-btn">
                            </toggle-button>
                            <!-- Reset button -->
                            <button class="button is-rounded reset-btn-green" style="border: 1.5px solid #87c540; color: #f2f2f2; background: transparent; min-width: 70px;"
                                v-on:click="physicsResetChanged.next($event)">
                                Reset
                            </button>
                        </div>

                        <!-- Physics Engine Dropdown -->
                        <b-field label="Physics Engine">
                            <b-select v-model="selectedPhysicsEngine" v-on:input="physicsEngineChanged.next($event)">
                                <option value="nvidia-physx">Nvidia PhysX</option>
                            </b-select>
                        </b-field>

                        <!-- Debug Section -->
                        <div class="subtitle">Debug</div>
                        <div style="display: flex; flex-direction: column; gap: 0.5em; margin-bottom: 1em;">
                            <button class="button is-rounded" style="border: 1.5px solid #87c540; color: #f2f2f2; background: transparent; min-width: 70px;"
                                v-on:click="physicsStepChanged.next($event)">
                                Step
                            </button>
                            <b-switch v-model="physicsColliderDebug" v-on:input="physicsColliderDebugChanged.next($event.target.checked)">Show Colliders</b-switch>
                            <b-switch v-model="physicsJointDebug" v-on:input="physicsJointDebugChanged.next($event.target.checked)">Show Joints</b-switch>
                        </div>
                    </div>
                </b-tab-item>


                <b-tab-item label="Credits" icon="video" class="tabItemScrollable tab-item" :order="5">
                    <template #header>
                        <div @click="collapseActiveTab($event, 5)"
                            v-bind:style="[tabContentHidden === false && activeTab === 5 ? {'height': '100%'} : {}]">
                            <!-- to get colored icons use: https://stackoverflow.com/a/43916743 -->
                            <img v-bind:src="[tabContentHidden === false && activeTab === 5 ? 'assets/ui/XMP 50X50.svg' : 'assets/ui/XMP 30X30.svg']"
                                v-bind:width="[tabContentHidden === false && activeTab === 5 ? '50px' : '30px']"
                                v-bind:style="[tabContentHidden === false && activeTab === 5 ? {'height': '100%'} : {}]">
                            <span 
                                v-show='isMobile === false && (tabContentHidden === true || activeTab !== 5)'>
                                Credits
                            </span>
                        </div>
                    </template>

                    <div class="tabContent">
                        <img src="assets/ui/Navigation_right_20px.svg" width="30px"
                            @click="collapseActiveTab($event, 5)">
                        <h2 class="title">Model Credits</h2>
                        <div class="modelCredit"><i>Copyright:</i><br/>{{ assetCopyright }}</div>
                        <div class="modelCredit"><i>Generated by:</i><br/>{{ assetGenerator }}</div>
                        <h2 class="title">Environment Credits</h2>
                        <div class="modelCredit"><i>Copyright:</i><br/><p v-html="environmentLicense"></p></div>
                        <h3 class="title">{{ xmp ? "XMP" : "" }}</h3>
                        <json-to-ui-template v-bind:data="xmp" v-bind:isinner="false"></json-to-ui-template>
                    </div>
                </b-tab-item>
                <!--<b-tab-item label="Capture" icon="video">
                    <template #header>
                        to get colored icons use: https://stackoverflow.com/a/43916743
                        <img src="assets/ui/Capture 30X30.svg" width="30px" height="30px">
                        <span>Capture</span>
                    </template>
                </b-tab-item>-->


                <b-tab-item label="Advanced Controls" icon="video" class="tabItemScrollable tab-item" :order="6">
                    <template #header>
                        <div @click="collapseActiveTab($event, 6)"
                            v-bind:style="[tabContentHidden === false && activeTab === 6 ? {'height': '100%'} : {}]">
                            <!-- to get colored icons use: https://stackoverflow.com/a/43916743 -->
                            <img v-bind:src="[tabContentHidden === false && activeTab === 6 ? 'assets/ui/Developer 50X50.svg' : 'assets/ui/Developer 30X30.svg']"
                                v-bind:width="[tabContentHidden === false && activeTab === 6 ? '50px' : '30px']"
                                v-bind:style="[tabContentHidden === false && activeTab === 6 ? {'height': '100%'} : {}]">
                            <span
                                v-show='isMobile === false && (tabContentHidden === true || activeTab !== 6)'>
                                Advanced<br>
                                Controls
                            </span>
                        </div>
                    </template>

                    <div class="tabContent">
                        <img src="assets/ui/Navigation_right_20px.svg" class="tabNavigationIcon" width="30px"
                            @click="collapseActiveTab($event, 6)">
                        <h2 class="title is-spaced">Advanced Controls</h2>
                        <b-field label="Capture Canvas" class="subtitle">
                            <button v-on:click="captureCanvas.next($event.target.value)" type="button" class="button is-rounded"><i
                                    class="fa fa-download downloadIcon"></i>Download as .png</button>
                        </b-field>
                        <b-field label="Debug Channels" class="subtitle">
                            <b-select v-on:input="debugchannelChanged.next($event.target.value)" v-model="debugChannel">
                                <template v-for="item in debugchannels">
                                    <option v-if="typeof(item.title) == 'string'" v-bind:value="item.title" v-bind:label="item.title"></option>
                                </template>
                                <template v-for="item in debugchannels">
                                    <optgroup v-if="typeof(item.title) == 'object'">
                                        <option v-for="subitem of item.title" v-bind:value="subitem" v-bind:label="subitem"></option>
                                    </optgroup>
                                </template>
                            </b-select>
                        </b-field>

                        <b-switch v-model="inputSmoothing" v-on:input="inputSmoothingChanged.next($event.target.checked)">Input Smoothing</b-switch>
                        <br>
                        <b-switch v-model="skinning" v-on:input="skinningChanged.next($event.target.checked)">Skinning</b-switch>
                        <br>
                        <b-switch v-model="morphing" v-on:input="morphingChanged.next($event.target.checked)">Morphing</b-switch>
                        <b-switch v-model="interactivity" v-on:input="interactivityChanged.next($event.target.checked)">KHR_interactivity</b-switch>
                        <b-switch v-model="hoverabilityEnabled" v-on:input="hoverabilityChanged.next($event.target.checked)">KHR_node_hoverability</b-switch>
                        <b-switch v-model="selectabilityEnabled" v-on:input="selectabilityChanged.next($event.target.checked)">KHR_node_selectability</b-switch>
                        <b-switch v-model="nodeVisibilityEnabled" v-on:input="nodeVisibilityChanged.next($event.target.checked)">KHR_node_visibility</b-switch>
                        <br>
                        <b-switch v-model="floatingPointFramebuffer" :disabled="!supportsFloatingPointFramebuffer" v-on:input="floatingPointFramebufferChanged.next($event.target.checked)">Floating-Point Framebuffer</b-switch>
                        <b-field label="Current Camera Values" class="subtitle">
                            <button v-on:click="cameraExport.next($event.target.value)" type="button" class="button is-rounded"><i
                                    class="fa fa-download downloadIcon"></i>Download as .gltf</button>
                        </b-field>
                        <b-field label="KHR Materials Extensions" class="subtitle">
                            <b-switch class="smallerLabel" v-model="clearcoatEnabled"
                                v-on:input="clearcoatChanged.next($event.target.checked)">
                                Clearcoat
                            </b-switch>
                            <b-switch class="smallerLabel" v-model="sheenEnabled" v-on:input="sheenChanged.next($event.target.checked)">
                                Sheen
                            </b-switch>
                            <b-switch class="smallerLabel" v-model="transmissionEnabled"
                                v-on:input="transmissionChanged.next($event.target.checked)" @input="transmissionTriggered($event.target.checked)">
                               Transmission
                            </b-switch>
                            <b-switch class="smallerLabel" v-model="diffuseTransmissionEnabled"
                                v-on:input="diffuseTransmissionChanged.next($event.target.checked)" @input="diffuseTransmissionTriggered($event.target.checked)">
                                Diffuse Transmission
                            </b-switch>
                            <b-switch class="smallerLabel"
                                v-bind:disabled="!transmissionEnabled && !diffuseTransmissionEnabled"
                                v-model="volumeEnabled" v-on:input="volumeChanged.next($event.target.checked)">
                                Volume
                            </b-switch>
                            <b-switch class="smallerLabel" v-model="volumeScatteringEnabled" v-on:input="volumeScatteringChanged.next($event.target.checked)"
                                v-bind:disabled="!volumeEnabled">
                                Volume Scattering
                            </b-switch>
                            <b-switch class="smallerLabel" v-model="iorEnabled" v-on:input="iorChanged.next($event.target.checked)">IOR</b-switch>
                            <b-switch class="smallerLabel" v-model="specularEnabled" v-on:input="specularChanged.next($event.target.checked)">
                                Specular                                        
                            </b-switch>
                            <b-switch class="smallerLabel" v-model="emissiveStrengthEnabled" v-on:input="emissiveStrengthChanged.next($event.target.checked)">
                                Emissive Strength
                            </b-switch>
                            <b-switch class="smallerLabel" v-model="iridescenceEnabled" v-on:input="iridescenceChanged.next($event.target.checked)">
                                Iridescence
                            </b-switch>
                            <b-switch class="smallerLabel" v-model="retroreflectionEnabled" v-on:input="retroreflectionChanged.next($event.target.checked)">
                                Retroreflection
                            </b-switch>
                            <b-switch class="smallerLabel" v-model="anisotropyEnabled" v-on:input="anisotropyChanged.next($event.target.checked)">
                                Anisotropy
                            </b-switch>
                            <b-switch class="smallerLabel" v-model="dispersionEnabled" v-on:input="dispersionChanged.next($event.target.checked)">
                                Dispersion
                            </b-switch>
                            <b-switch class="smallerLabel" v-model="gaussianSplattingEnabled" v-on:input="gaussianSplattingChanged.next($event.target.checked)">
                                Gaussian Splatting
                            </b-switch>
                        </b-field>
                        <b-field label="Statistics" class="subtitle">
                            <json-to-ui-template v-bind:data="statistics" v-bind:isinner="false">
                            </json-to-ui-template>
                        </b-field>
                        <div class="pb-6"></div>
                    </div>
                </b-tab-item>

            </b-tabs>
        
    </div>
</template>

<script>
import { Subject } from "rxjs";

export default {
    name: "App",
    data() {
        return {
            modelChanged: new Subject(),
            flavourChanged: new Subject(),
            sceneChanged: new Subject(),
            cameraChanged: new Subject(),
            selectedGraphChanged: new Subject(),

            debugchannelChanged: new Subject(),
            tonemapChanged: new Subject(),
            skinningChanged: new Subject(),
            inputSmoothingChanged: new Subject(),
            punctualLightsChanged: new Subject(),

            iblChanged: new Subject(),
            blurEnvChanged: new Subject(),
            morphingChanged: new Subject(),
            interactivityChanged: new Subject(),
            colorChanged: new Subject(),

            environmentRotationChanged: new Subject(),
            animationPlayChanged: new Subject(),
            graphPlayChanged: new Subject(),
            animationResetChanged: new Subject(),
            graphResetChanged: new Subject(),
            variantChanged: new Subject(),
            exposureChanged: new Subject(),

            clearcoatChanged: new Subject(),
            sheenChanged: new Subject(),
            transmissionChanged: new Subject(),
            diffuseTransmissionChanged: new Subject(),
            cameraExport: new Subject(),

            captureCanvas: new Subject(),
            iblIntensityChanged: new Subject(),

            volumeChanged: new Subject(),
            iorChanged: new Subject(),
            iridescenceChanged: new Subject(),
            retroreflectionChanged: new Subject(),
            anisotropyChanged: new Subject(),
            dispersionChanged: new Subject(),
            specularChanged: new Subject(),
            emissiveStrengthChanged: new Subject(),
            volumeScatteringChanged: new Subject(),
            hoverabilityChanged: new Subject(),
            selectabilityChanged: new Subject(),
            nodeVisibilityChanged: new Subject(),
            gaussianSplattingChanged: new Subject(),
            floatingPointFramebufferChanged: new Subject(),
            renderEnvChanged: new Subject(),
            addEnvironmentChanged: new Subject(),
            selectedAnimationsChanged: new Subject(),
            selectedEnvironmentChanged: new Subject(),

            physicsEnabledChanged: new Subject(),
            physicsResetChanged: new Subject(),
            physicsEngineChanged: new Subject(),
            physicsStepChanged: new Subject(),
            physicsColliderDebugChanged: new Subject(),
            physicsJointDebugChanged: new Subject(),

            validatorChanged: new Subject(),

            fullheight: true,
            right: true,
            models: ["DamagedHelmet"],
            flavours: [
                "glTF",
                "glTF-Binary",
                "glTF-Quantized",
                "glTF-Draco",
                "glTF-pbrSpecularGlossiness"
            ],
            scenes: [{ title: "0" }, { title: "1" }],
            cameras: [{ title: "User Camera", index: -1 }],
            materialVariants: ["None"],

            animations: [{ title: "None" }],
            graphs: [],
            tonemaps: [{ title: "None" }],
            debugchannels: [{ title: "None" }],
            xmp: [{ title: "xmp" }],
            assetCopyright: "",
            assetGenerator: "",
            statistics: [],

            selectedModel: "DamagedHelmet",
            selectedFlavour: "",
            selectedScene: {},
            selectedCamera: {},
            selectedVariant: "None",
            selectedAnimations: [],
            disabledAnimations: [],
            selectedGraph: null,
            selectedPhysicsEngine: "nvidia-physx",
            physicsColliderDebug: false,
            physicsJointDebug: false,

            animationState: true,
            graphState: true,
            physicsState: true,

            validationReport: {},
            validationReportDescription: {},

            ibl: true,
            iblIntensity: 0.0,
            punctualLights: true,
            renderEnv: true,
            blurEnv: true,
            clearColor: "",
            environmentRotations: [
                { title: "+Z" },
                { title: "-X" },
                { title: "-Z" },
                { title: "+X" }
            ],
            selectedEnvironmentRotation: "+Z",
            environments: [{ index: 0, name: "" }],
            selectedEnvironment: 0,

            debugChannel: "None",
            exposureSetting: 0,
            toneMap: "Khronos PBR Neutral",
            skinning: true,
            inputSmoothing: true,
            floatingPointFramebuffer: true,
            supportsFloatingPointFramebuffer: true,
            morphing: true,
            interactivity: true,
            clearcoatEnabled: true,
            sheenEnabled: true,
            transmissionEnabled: true,
            volumeEnabled: true,
            iorEnabled: true,
            iridescenceEnabled: true,
            retroreflectionEnabled: true,
            diffuseTransmissionEnabled: true,
            anisotropyEnabled: true,
            dispersionEnabled: true,
            specularEnabled: true,
            emissiveStrengthEnabled: true,
            volumeScatteringEnabled: true,
            hoverabilityEnabled: true,
            selectabilityEnabled: true,
            nodeVisibilityEnabled: true,
            gaussianSplattingEnabled: true,

            hasPhysics: false,

            activeTabIndex: 0,
            activeTab: 0,
            tabContentHidden: true,
            loadingComponent: undefined,
            showDropDownOverlay: false,
            uploadedHDR: undefined,
            uiVisible: false,
            isMobile: false,
            noUi: false,

            // these are handles for certain ui change related things
            environmentVisiblePrefState: true,
            volumeEnabledPrefState: true,
            customEvents: [],
            selectedCustomEvent: null,
            customEventValues: {},
            customEventEnabled: false,
            customEventFocusedInput: null,
            customEventFocusedIndex: null,
            customEventValid: true,
            customEventSendClicked: new Subject()
        };
    },
    watch: {
        selectedAnimations: function (newValue) {
            this.selectedAnimationsChanged.next(newValue);
        },
        selectedGraph: function (newValue) {
            this.selectedGraphChanged.next(newValue);
        },
        selectedCustomEvent: function (newValue) {
            this.updateCustomEventValues(newValue);
        },
        customEvents: function (newValue) {
            // Auto-select the first custom event when the array is populated
            if (newValue && newValue.length > 0) {
                this.selectedCustomEvent = newValue[0].id;
            } else {
                this.selectedCustomEvent = null;
            }
        },
        customEventFocusedInput: function () {
            this.customEventValid = this.isCustomEventValid();
        }
    },
    beforeMount: function () {
        // Definition of mobile: https://bulma.io/documentation/start/responsiveness/
        if (document.documentElement.clientWidth > 768) {
            this.uiVisible = true;
            this.isMobile = false;
        } else {
            this.uiVisible = false;
            this.isMobile = true;
        }
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const noUI = urlParams.get("noUI");
        if (noUI !== null) {
            this.uiVisible = false;
            this.noUI = true;
        }
    },
    mounted: function () {
        // remove input class from color picker (added by default by buefy)
        const colorPicker = document.getElementById("clearColorPicker");
        colorPicker.classList.remove("input");

        // test if webgl is present
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("webgl2", {
            alpha: false,
            antialias: true
        });
        if (context === undefined || context === null) {
            this.error(
                "The sample viewer requires WebGL 2.0, which is not supported by this browser or device. " +
                    "Please try again with another browser, or check https://get.webgl.org/webgl2/ " +
                    "if you believe you are seeing this message in error.",
                15000
            );
        }

        // change styling of tab-bar
        this.$nextTick(function () {
            // Code that will run only after the
            // entire view has been rendered

            let navElement = document.getElementById("tabsContainer").childNodes[0];

            if (!this.isMobile) {
                navElement.style.width = "100px";
            }

            let ulElement = navElement.childNodes[0];
            while (ulElement) {
                if (ulElement.nodeName === "UL") {
                    break;
                }
                ulElement = ulElement.nextElementSibling;
            }

            // Avoid margin on top for mobile devices
            if (this.isMobile) {
                let liElement = ulElement.childNodes[0];
                while (liElement) {
                    if (liElement.nodeName === "LI") {
                        break;
                    }
                    liElement = liElement.nextElementSibling;
                }
                liElement.style.marginTop = "0px";
            }

            // add github logo to tab-bar
            var a = document.createElement("a");
            a.href = "https://github.com/KhronosGroup/glTF-Sample-Viewer";
            var img = document.createElement("img");
            img.src = "assets/ui/GitHub-Mark-Light-32px.png";
            img.style.width = "22px";
            img.style.height = "22px";
            ulElement.appendChild(a);
            a.appendChild(img);
        });
    },
    computed: {
        hasInteractivityGraphs() {
            return this.graphs && this.graphs.length > 0;
        },
        showGraphsTab() {
            return this.hasInteractivityGraphs && this.interactivity;
        },
        showPhysicsTab() {
            return this.hasPhysics;
        },
        currentCustomEvent() {
            if (!this.selectedCustomEvent || !this.customEvents) return null;
            return this.customEvents.find((event) => event.id === this.selectedCustomEvent);
        },
        customEventInputs() {
            if (!this.currentCustomEvent) return [];
            const event = this.currentCustomEvent;
            if (!event.values) return [];

            return Object.keys(event.values).map((key) => ({
                name: key,
                type: event.values[key].type,
                value: event.values[key].value
            }));
        }
    },
    methods: {
        async copyToClipboard(text) {
            try {
                await navigator.clipboard.writeText(text);
                this.$buefy.toast.open({
                    message: "Copied to clipboard",
                    type: "is-success"
                });
                // eslint-disable-next-line no-unused-vars
            } catch (err) {
                this.error("Error copying to clipboard.");
            }
        },
        downloadJSON(filename, json) {
            const text = JSON.stringify(json, undefined, 4);
            const dataURL = "data:application/json;charset=utf-8," + encodeURIComponent(text);
            const element = document.createElement("a");
            element.setAttribute("href", dataURL);
            element.setAttribute("download", filename);
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        },

        isCustomEventValid() {
            const form = document.getElementById("customEventForm");
            if (!form) return true;
            return form.checkValidity();
        },

        /**
         * Creates a div string summarizing the given issues.
         *
         * If the given issues are empty or do not contain any errors,
         * warnings, or infos, then the empty string is returned.
         *
         * Otherwise, the div contains the number of errors/warnings/infos
         * with an appropriate background color. When all warnings of
         * the given report are ignored, then this will only be a
         * small "info" div. Clicking on that will expand the details
         * about the ignored warnings.
         *
         * @param {any} issues The `issues` property that is part of
         * the validation report of the glTF Validator
         * @returns The div string
         */
        getValidationInfoDiv: function (issues) {
            let info = "";
            let color = "white";
            const padding = this.isMobile ? "right:-3px;top:-18px;" : "right:-18px;top:-18px;";
            if (this.validationReport?.error) {
                info = "X";
                color = "red";
                return (
                    `<div style="display:flex;color:black; position:absolute; ${padding} ` +
                    `font-size:80%; font-weight:bold; background-color:${color}; border-radius:50%; width:fit-content; ` +
                    `min-width:2rem; align-items:center;aspect-ratio:1/1;justify-content:center;">${info}</div>`
                );
            }
            if (!issues) {
                return "";
            }
            if (issues.numErrors > 0) {
                info = `${issues.numErrors}`;
                color = "red";
            } else if (issues.numWarnings > 0) {
                const allIgnored =
                    issues.numWarnings === this.validationReportDescription?.numIgnoredWarnings;
                if (allIgnored) {
                    info = "i";
                    color = "lightBlue";
                } else {
                    info = `${issues.numWarnings}`;
                    color = "yellow";
                }
            } else if (issues.numInfos > 0) {
                info = `${issues.numInfos}`;
            }
            if (info.length > 3) {
                info = "999+";
            }
            if (info === "") {
                return "";
            }
            const infoDiv =
                `<div style="display:flex;color:black; position:absolute; ${padding} ` +
                `font-size:80%; font-weight:bold; background-color:${color}; border-radius:50%; width:fit-content; ` +
                `min-width:2rem; align-items:center;aspect-ratio:1/1;justify-content:center;">${info}</div>`;
            return infoDiv;
        },

        getValidationCounter: function () {
            const infoDiv = this.getValidationInfoDiv(this.validationReport?.issues);
            if (this.tabContentHidden === false && this.activeTab === 2) {
                return (
                    `<div style="position:relative; width:50px; height:100%">` +
                    `<img src="assets/ui/Capture 50X50.svg" width="50px" height="100%">` +
                    infoDiv +
                    `</div>`
                );
            }
            return (
                `<div style="position:relative; width:50px; height:100%">` +
                `<img src="assets/ui/Capture 30X30.svg" width="30px">` +
                infoDiv +
                `</div>`
            );
        },
        iblTriggered: function (value) {
            if (value == false) {
                this.environmentVisiblePrefState = this.renderEnv;
                this.renderEnv = false;
                this.renderEnvChanged.next(false);
            } else {
                this.renderEnv = this.environmentVisiblePrefState;
                this.renderEnvChanged.next(this.renderEnv);
            }
        },
        transmissionTriggered: function (value) {
            if (value == false && this.diffuseTransmissionEnabled == false) {
                this.volumeEnabledPrefState = this.volumeEnabled;
                this.volumeEnabled = false;
            } else if (value == true && this.diffuseTransmissionEnabled == false) {
                this.volumeEnabled = this.volumeEnabledPrefState;
            }
        },
        diffuseTransmissionTriggered: function (value) {
            if (value == false && this.transmissionEnabled == false) {
                this.volumeEnabledPrefState = this.volumeEnabled;
                this.volumeEnabled = false;
            } else if (value == true && this.transmissionEnabled == false) {
                this.volumeEnabled = this.volumeEnabledPrefState;
            }
        },
        collapseActiveTab: function (event, item) {
            if (item === this.activeTab) {
                this.tabContentHidden = !this.tabContentHidden;

                if (this.tabContentHidden) {
                    // remove is-active class if tabs are hidden
                    event.stopPropagation();

                    const navElements =
                        document.getElementById("tabsContainer").children[0].children[0].children;
                    for (let elem of navElements) {
                        elem.classList.remove("is-active");
                    }
                } else {
                    // add is-active class to correct element
                    const activeNavElement =
                        document.getElementById("tabsContainer").children[0].children[0].children[
                            this.activeTabIndex
                        ];
                    activeNavElement.classList.add("is-active");
                }
            } else {
                // reset tab visibility
                this.tabContentHidden = false;
            }
            this.activeTab = item;
        },
        warn(message) {
            this.$buefy.toast.open({
                message: message,
                type: "is-warning"
            });
        },
        error(message, duration = 5000) {
            this.$buefy.toast.open({
                message: message,
                type: "is-danger",
                duration: duration
            });
        },
        goToLoadingState() {
            if (this.loadingComponent !== undefined) {
                return;
            }
            this.loadingComponent = this.$buefy.loading.open({
                container: null
            });
        },
        exitLoadingState() {
            if (this.loadingComponent === undefined) {
                return;
            }
            this.loadingComponent.close();
            this.loadingComponent = undefined;
        },
        onFileChange(e) {
            const file = e.target.files[0];
            this.addEnvironmentChanged.next({ hdr_path: file });
        },

        toggleUI() {
            this.uiVisible = !this.uiVisible;
        },
        updateCustomEventValues(selectedEventId) {
            if (!selectedEventId || !this.customEvents) {
                this.customEventValues = {};
                return;
            }

            const event = this.customEvents.find((e) => e.id === selectedEventId);
            if (!event || !event.values) {
                this.customEventValues = {};
                return;
            }

            // Initialize all input values based on the event definition
            const values = {};
            Object.keys(event.values).forEach((key) => {
                const valueDefn = event.values[key];
                values[key] =
                    valueDefn.value !== undefined
                        ? valueDefn.value
                        : this.getDefaultValue(valueDefn.type);
            });
            this.customEventValues = values;
        },
        getDefaultValue(type) {
            switch (type) {
            case "bool":
                return false;
            case "int":
                return 0;
            case "float":
                return 0.0;
            case "float2":
                return [0, 0];
            case "float3":
                return [0, 0, 0];
            case "float4":
                return [0, 0, 0, 0];
            case "float2x2":
                return [1, 0, 0, 1];
            case "float3x3":
                return [1, 0, 0, 0, 1, 0, 0, 0, 1];
            case "float4x4":
                return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            default:
                return null;
            }
        },
        sendCustomEvent() {
            if (!this.selectedCustomEvent || !this.currentCustomEvent) {
                this.$buefy.toast.open({
                    message: "Please select a custom event first",
                    type: "is-warning",
                    duration: 3000
                });
                return;
            }

            this.customEventSendClicked.next({
                eventId: this.selectedCustomEvent,
                values: this.customEventValues
            });
            this.$buefy.toast.open({
                message: `Custom event '${this.selectedCustomEvent}' sent successfully!`,
                type: "is-success",
                duration: 3000
            });
        }
    }
};
</script>
