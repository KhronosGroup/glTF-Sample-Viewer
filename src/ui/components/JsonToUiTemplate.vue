<template>
    <div>
        <div v-for="(value, name) in data">
            <b-collapse :class="(isinner === false) ? 'cardGrayMain' : 'cardGrayMainInner'" animation="slide"  style="word-break: break-word;">
                <!-- header -->
                <template #trigger="props">
                    <div class="cardHeader" role="button">
                        <p class="smallerLabel">
                            {{ name }}
                        </p>
                        <!-- a element needed for buefy. can be removed if hover effects are made custom -->
                        <a>
                            <b-icon :icon="props.open ? 'menu-down' : 'menu-up'">
                            </b-icon>
                        </a>
                    </div>
                </template>

                <!-- content -->
                <!-- if value is object -->
                <div v-if="value !== null && value !== undefined && value.constructor.name === 'Object'">
                    <json-to-ui-template v-bind:data="value" v-bind:isinner="!isinner"></json-to-ui-template>
                </div>
                <!-- if value is array -->
                <div v-else-if="Array.isArray(value)">
                    <label v-for="arrayValue in value" class="smallestLabel" style="display: block;">{{ arrayValue }}</label>
                </div>
                <div v-else>
                    <label class="smallestLabel">{{ value }}</label>
                </div>
            </b-collapse>
        </div>
    </div>
</template>

<script>
export default {
    name: "JsonToUiTemplate",
    props: ["data", "isinner"]
};
</script>
