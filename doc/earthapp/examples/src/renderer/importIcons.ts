// requires eui.d.ts

import { appendIconComponentCache } from '@elastic/eui/es/components/icon/icon'

// make rollup pack these icons
import { icon as arrowDown } from '@elastic/eui/es/components/icon/assets/arrow_down'
import { icon as listAdd } from '@elastic/eui/es/components/icon/assets/list_add'
import { icon as tableDensityExpanded } from '@elastic/eui/es/components/icon/assets/table_density_expanded'
import { icon as sortable } from '@elastic/eui/es/components/icon/assets/sortable'
import { icon as fullScreen } from '@elastic/eui/es/components/icon/assets/full_screen'
import { icon as arrowLeft } from '@elastic/eui/es/components/icon/assets/arrow_left'
import { icon as arrowRight } from '@elastic/eui/es/components/icon/assets/arrow_right'
import { icon as sortDown } from '@elastic/eui/es/components/icon/assets/sort_down'

// tell EUI they have been pre-packed and not to load them dynamically
appendIconComponentCache({
    arrowDown,
    listAdd,
    tableDensityExpanded,
    sortable,
    fullScreen,
    arrowLeft,
    arrowRight,
    sortDown,
})
