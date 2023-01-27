import {EuiIcon, IconType} from "@elastic/eui/src/components/icon";
import {EuiFlexGroup, EuiFlexItem} from "@elastic/eui/src/components/flex";
import {EuiButtonIcon} from "@elastic/eui/src/components/button";
import {EuiFieldText} from "@elastic/eui/src/components/form/field_text";
import {useState} from "react";
import React from "react";

export function QueryFilter(props: {
    label?: string; // TODO PrependOrAppendType
    where: string | null;
    apply: (filter: {
        where: string | null;
    }) => void;
}): JSX.Element {

    const [whereText, setWhereText] = useState(props.where || "");

    const isFiltering = !!props.where;

    const whereChanged = whereText.trim() != (props.where || "").trim();
    const filterChanged = whereChanged;

    const applyFilter = () => {
        props.apply({
            where: whereText || null,
        });
    };
    const cancel = () => {
        setWhereText(props.where || "");
    };
    const reset = () => {
        setWhereText("");
        // can't use applyFilter() because `whereText` still has the old value here
        props.apply({
            where: null,
        });
    };

    const But = ({iconType, label, disabled, onClick}: {
        iconType: IconType;
        label: string;
        disabled: boolean;
        onClick: () => void;
    }) =>
        <EuiFlexItem grow={false}>
            <EuiButtonIcon aria-label={label} title={label}
                           iconType={iconType} size="s" display="base"
                           disabled={disabled} onClick={onClick} />
        </EuiFlexItem>;

    return <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={true}>
            <EuiFieldText placeholder="TRUE"
                          value={whereText}
                          fullWidth={true} compressed={true}
                          prepend={props.label || "WHERE"}
                          {/* TODO try to get icon inside field, like for loading/invalid */ ...{} }
                          append={whereChanged ? <EuiIcon type="pencil" /> : undefined}
                          onChange={e => setWhereText(e.target.value)}
                          onKeyDown={e => {
                              if (e.key == 'Enter') {
                                  applyFilter();
                              }
                          }} />
        </EuiFlexItem>

        <But iconType="search" label={filterChanged ? "Apply changes" : "No changes to apply"} disabled={!filterChanged} onClick={applyFilter} />
        <But iconType="editorUndo" label={filterChanged ? "Revert changes" : "No changes to revert"} disabled={!filterChanged} onClick={cancel} />
        <But iconType="cross" label={isFiltering ? "Clear filter" : "No filter to clear"} disabled={!isFiltering} onClick={reset} />

    </EuiFlexGroup>
}
