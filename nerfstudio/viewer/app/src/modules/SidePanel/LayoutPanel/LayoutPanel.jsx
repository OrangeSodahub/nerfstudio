import * as React from 'react';
import { Delete, KeyboardArrowUp, KeyboardArrowDown, ExpandMore, Edit, Visibility } from '@mui/icons-material';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { Accordion, AccordionSummary, Button, TextField, Stack } from '@mui/material';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import { drawLayout } from '../../Scene/drawing';

interface ClassItemProps {
  category: String;
  onCategoryClick: (category: String) => void;
  selected: Boolean;
}

function ClassItem(props: ClassItemProps) {
  const { category, onCategoryClick, selected } = props;

  return (
    <Button
      variant="contained" color="primary"
      onClick={() => onCategoryClick(category)}
      style={selected ? { background: 'gray' } : {}} >
      {category}
    </Button>
  );
}

function LayoutList(props) {
  const sceneTree = props.sceneTree;
  const layouts = props.layouts;
  const transform_controls = props.transform_controls;
  const setLayouts = props.setLayouts;
  const swapLayouts = props.swapLayouts;
  const layoutProperties = props.layoutProperties;
  const setLayoutProperties = props.setLayoutProperties;
  const setCategoryCounts = props.setCategoryCounts;

  const [expanded, setExpanded] = React.useState(null);

  const set_transform_controls = (index) => {
    const layout = sceneTree.find_object_no_create([
      'Layout Set', 'Layouts', index.toString(), 'Layout'
    ]);
    if (layout != null) {
      const viewer_buttons = document.getElementsByClassName(
        'ViewerWindow-buttons'
      )[0];
      if (layout === transform_controls.object) {
        transform_controls.detach();
        viewer_buttons.style.display = 'none';
      } else {
        transform_controls.detach();
        transform_controls.attach(layout);
        viewer_buttons.style.display = 'block';
      }
    }
  };

  const handleChange = (layoutUUID: string) => (
    event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? layoutUUID : false);
    };

  const delete_layout = (index) => {
    console.log('Deleting layout: ', index);
    // update counts
    setCategoryCounts((prevCounts) => {
      const updatedCounts = { ...prevCounts };
      const selectedCategory = layouts[index].properties.get('CATEGORY');
      updatedCounts[selectedCategory] -= 1;
      if (updatedCounts[selectedCategory] === 0) {
        delete updatedCounts[selectedCategory];
      }
      return updatedCounts;
    });
    // delete object
    sceneTree.delete(['Layout Set', 'Layouts', index.toString(), 'Layout']);
    setLayouts([...layouts.slice(0, index), ...layouts.slice(index + 1)]);
    // delete transform controls
    transform_controls.detach();
    const viewer_buttons = document.getElementsByClassName(
      'ViewerWindow-buttons',
    )[0];
    viewer_buttons.style.display = 'none';
  };

  const layoutList = layouts.map((layout, index) => {
    return (
      <Accordion
        className="LayoutList-row"
        key={layout.uuid}
        expanded={expanded === layout.uuid}
        onChange={handleChange(layout.uuid)}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: '#eeeeee' }} />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Stack spacing={0}>
            <Button
              size="small"
              onClick={(e) => {
                swapLayouts(index, index - 1);
                e.stopPropagation();
              }}
              style={{
                maxWidth: '20px',
                maxHeight: '20px',
                minWidth: '20px',
                minHeight: '20px',
              }}
              disabled={index === 0}
            >
              <KeyboardArrowUp />
            </Button>
            <Button
              size="small"
              onClick={(e) => {
                swapLayouts(index, index + 1);
                e.stopPropagation();
              }}
              style={{
                maxWidth: '20px',
                maxHeight: '20px',
                minWidth: '20px',
                minHeight: '20px',
              }}
              disabled={index === layouts.length - 1}
            >
              <KeyboardArrowDown />
            </Button>
          </Stack>
          <Button size="small" sx={{ ml: '3px' }}>
            <TextField
              id="standard-basic"
              value={layout.properties.get('NAME')}
              variant="standard"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const layoutProps = new Map(layoutProperties);
                layoutProps.get(layout.uuid).set('NAME', e.target.value);
                setLayoutProperties(layoutProps);
              }}
              sx={{
                alignItems: 'center',
                alignContent: 'center',
              }}
            />
            <TextField
              id="standard-basic"
              value={layout.properties.get('CATEGORY')}
              variant="standard"
              onClick={(e) => e.stopPropagation()}
              sx={{
                alignItems: 'center',
                alignContent: 'center',
              }}
            />
          </Button>
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              set_transform_controls(index);
            }}
          >
            <Edit />
          </Button>
          <Stack spacing={0} direction="row" justifyContent="end">
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Visibility />
            </Button>
            <Button size="small" onClick={() => delete_layout(index)}>
              <Delete />
            </Button>
          </Stack>
        </AccordionSummary>
      </Accordion>
    );
  });
  return <div>{layoutList}</div>;
}

export default function LayoutPanel(props) {
  const sceneTree = props.sceneTree;
  const transform_controls = sceneTree.find_object_no_create([
    'Transform Controls',
  ]);

  // react state
  const [layouts, setLayouts] = React.useState([]);
  // Mapping of layout id to each layout's properties
  const [layoutProperties, setLayoutProperties] = React.useState(new Map());

  // click the class button
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [categoryCounts, setCategoryCounts] = React.useState({});
  const [addButtonEnabled, setAddButtonEnabled] = React.useState(false);
  const handleCategoryClick = (category) => {
    if (selectedCategory && selectedCategory === category) {
      setSelectedCategory(null);
      setAddButtonEnabled(false);
    } else {
      setSelectedCategory(category);
      setAddButtonEnabled(true);
    }
  };

  const add_layout = () => {
    setCategoryCounts((prevCounts) => ({...prevCounts,
      [selectedCategory]: (prevCounts[selectedCategory] || 0) + 1,
    }));
    const new_layout = drawLayout(selectedCategory);
    const new_layout_properties = new Map();
    new_layout.properties = new_layout_properties;
    new_layout_properties.set('NAME', `idx.${layouts.length}`);
    new_layout_properties.set('CATEGORY', `${selectedCategory}`)
    const new_properties = new Map(layoutProperties);
    setLayoutProperties(new_properties);

    const new_layout_list = layouts.concat(new_layout);
    setLayouts(new_layout_list);
  };

  const swapLayouts = (index, new_index) => {
    if (
      Math.min(index, new_index) < 0 ||
      Math.max(index, new_index) >= layouts.length
    )
      return;

    const new_layouts = [
      ...layouts.slice(0, index),
      ...layouts.slice(index + 1),
    ];
    setLayouts([
      ...new_layouts.slice(0, new_index),
      layouts[index],
      ...new_layouts.slice(new_index),
    ]);
  };

  let update_layouts_interval = null;
  // eslint-disable-next-line no-unused-vars
  transform_controls.addEventListener('mouseDown', (event) => {
    // prevent multiple loops
    if (update_layouts_interval === null) {
      // hardcoded for 100 ms per update
      update_layouts_interval = setInterval(() => {}, 100);
    }
  });
  // eslint-disable-next-line no-unused-vars
  transform_controls.addEventListener('mouseUp', (event) => {
    if (update_layouts_interval !== null) {
      clearInterval(update_layouts_interval);
      update_layouts_interval = null;
      setLayouts(layouts);
    }
  });

  // draw layouts to the scene
  React.useEffect(() => {
    const labels = Array.from(document.getElementsByClassName('label'));
    labels.forEach((label) => {
      label.remove();
    });

    sceneTree.delete(['Layout Set', 'Layouts']); // delete old layouts

    for (let i = 0; i < layouts.length; i += 1) {
      const layout = layouts[i];

      const labelDiv = document.createElement('div');
      labelDiv.className = 'label';
      labelDiv.textContent = layout.properties.get('NAME');
      labelDiv.style.color = 'black';
      labelDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.61)';
      labelDiv.style.backgroundFilter = 'blur(5px)';
      labelDiv.style.padding = '6px';
      // TODO: modify this attribute
      labelDiv.style.visibility = 'visible';
      const layout_label = new CSS2DObject(labelDiv)
      layout_label.name = 'LAYOUT_LABEL';
      layout_label.position.set(0, -0.1, -0.1);
      layout_label.layers.set(0);

      // layout
      sceneTree.set_object_from_path(
        ['Layout Set', 'Layouts', i.toString(), 'Layout'],
        layout,
      );
    }
    // eslint-disable-next-line react-hooks.exhaustive-deps
  }, [layouts, layoutProperties]);

  // TODO: finish this
  // const get_layout_set = () => {
  //   const layout_set = [];
  // }
  
  // const export_layout_set = () => {
  //   // export the layout set
  //   sendWebsocketMessage(viser_websocket, { type: 'SaveCheckpointMessage' });
  //   const layout_set_object = get_layout_set();
  //   console.log()
  // };

  // const load_layout_set = (layout_set_object) => {
  //   const new_layout_list = [];
  //   const new_properties = new Map(layoutProperties);
  // };

  const categories = [
    'wall', 'floor', 'cabinet', 'bed', 'chair', 'sofa', 'table',
    'door', 'window', 'bokshelf', 'counter', 'desk']

  return (
      <div className="LayoutPanel">
        {categories.map((category) => (
          <ClassItem 
            key={category}
            category={category}
            onCategoryClick={handleCategoryClick}
            selected={selectedCategory && selectedCategory === category} />
        ))}
        <Button
          varient="outlined"
          startIcon={<AddBoxRoundedIcon />}
          onClick={add_layout}
          disabled={!addButtonEnabled}
        >
          {addButtonEnabled ? 'Add layout' : 'Click one category'}
        </Button>
        <div>
          {Object.entries(categoryCounts).map(([category, count]) => (
            <p key={category}>{`${category} count: ${count}`}</p>
          ))}
        </div>
        <div className="LayoutList-container">
          <LayoutList
            sceneTree={sceneTree}
            layouts={layouts}
            transform_controls={transform_controls}
            setLayouts={setLayouts}
            swapLayouts={swapLayouts}
            layoutProperties={layoutProperties}
            setLayoutProperties={setLayoutProperties}
            setCategoryCounts={setCategoryCounts}
          />
        </div>
      </div>
  );
}