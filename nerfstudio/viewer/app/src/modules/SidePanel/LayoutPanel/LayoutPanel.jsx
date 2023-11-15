import * as React from 'react';
import * as THREE from 'three';
import { Delete, KeyboardArrowUp, KeyboardArrowDown, ExpandMore, Edit, Visibility } from '@mui/icons-material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { Accordion, AccordionSummary, Button, TextField, Stack, Slider, AccordionDetails, Typography } from '@mui/material';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import { drawLayout } from '../../Scene/drawing';
import {
  ViserWebSocketContext,
  sendWebsocketMessage,
} from '../../WebSocket/ViserWebSocket';
import LoadSetModal from '../../LoadSetModal';

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

  const handleSizeChange = (dimension, index, value) => {
    setLayouts((prevLayouts) => {
      const newLayouts = [...prevLayouts];
      const layout = newLayouts[index];
      const scaleX = dimension === 'x' ? value : layout.size.x / layout.originalSize.x;
      const scaleY = dimension === 'y' ? value : layout.size.y / layout.originalSize.y;
      const scaleZ = dimension === 'z' ? value : layout.size.z / layout.originalSize.z;
      layout.scale.set(scaleX, scaleY, scaleZ);
      const newSize = new THREE.Vector3(scaleX * layout.originalSize.x,
                                        scaleY * layout.originalSize.y,
                                        scaleZ * layout.originalSize.z);
      layout.size = newSize;
      return newLayouts;
    });
  }

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
              sx={{alignItems: 'center', alignContent: 'center'}}
            />
            <Typography style={{ textTransform: 'lowercase' }}>({layout.properties.get('CATEGORY')})</Typography>
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
        <AccordionDetails>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography style={{ marginRight: '10px' }}>Scale(X)</Typography>
            <Slider
              value={layout.size.x / layout.originalSize.x}
              onChange={(event, value) => handleSizeChange('x', index, value)}
              aria-labelledby={`size-x-slider-${index}`}
              valueLabelDisplay="auto"
              min={0.1} max={2} step={0.02}
            />
            <Typography style={{ marginLeft: '10px' }}>{(layout.size.x / layout.originalSize.x).toFixed(1)}</Typography>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography style={{ marginRight: '10px' }}>Scale(Y)</Typography>
            <Slider
              value={layout.size.y / layout.originalSize.y}
              onChange={(event, value) => handleSizeChange('y', index, value)}
              aria-labelledby={`size-y-slider-${index}`}
              valueLabelDisplay="auto"
              min={0.1} max={2} step={0.02}
            />
            <Typography style={{ marginLeft: '10px' }}>{(layout.size.y / layout.originalSize.y).toFixed(1)}</Typography>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography style={{ marginRight: '10px' }}>Scale(Z)</Typography>
            <Slider
              value={layout.size.z / layout.originalSize.z}
              onChange={(event, value) => handleSizeChange('z', index, value)}
              aria-labelledby={`size-z-slider-${index}`}
              valueLabelDisplay="auto"
              min={0.1} max={2} step={0.02}
            />
            <Typography style={{ marginLeft: '10px' }}>{(layout.size.z / layout.originalSize.z).toFixed(1)}</Typography>
          </div>
        </AccordionDetails>
      </Accordion>
    );
  });
  return <div>{layoutList}</div>;
}

export default function LayoutPanel(props) {
  const categories = [
    'wall', 'floor', 'cabinet', 'bed', 'chair', 'sofa', 'table',
    'door', 'window', 'bokshelf', 'counter', 'desk']

  const sceneTree = props.sceneTree;
  const viser_websocket = React.useContext(ViserWebSocketContext);
  const transform_controls = sceneTree.find_object_no_create([
    'Transform Controls',
  ]);

  // react state
  const [layouts, setLayouts] = React.useState([]);
  const [id, setId] = React.useState(0);
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
  const [load_set_modal_open, setLoadSetModalOpen] = React.useState(false);

  const add_layout = (size?: THREE.Vector3, position?: THREE.Vector3) => {
    setCategoryCounts((prevCounts) => ({...prevCounts,
      [selectedCategory]: (prevCounts[selectedCategory] || 0) + 1,
    }));
    const cat_id = categories.findIndex(item => item === selectedCategory.toLowerCase());

    let new_layout: THREE.Object3D;
    if (size && position) {
      new_layout = drawLayout(selectedCategory, size, position);
    } else {
      new_layout = drawLayout(selectedCategory);
    }
    const new_layout_properties = new Map();
    new_layout.properties = new_layout_properties;
    new_layout_properties.set('NAME', `idx.${id}`);
    new_layout_properties.set('CATEGORY', `${selectedCategory}`)
    new_layout_properties.set('CAT_ID', `${cat_id}`)
    const new_properties = new Map(layoutProperties);
    setLayoutProperties(new_properties);

    const new_layout_list = layouts.concat(new_layout);
    setLayouts(new_layout_list);
    setId(id + 1)
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
  }, [layouts, layoutProperties]);

  const handleOpacityChange = (event, value) => {
    setLayouts((prevLayouts) => {
      const newLayouts = prevLayouts.map((layout) => {
        const color = layout.material.color
        const new_layout = layout
        new_layout.material = new THREE.MeshBasicMaterial({color, transparent: true, opacity: value});
        new_layout.opacity = value;
        return new_layout;
      });
      return newLayouts;
    });
  };
  
  // TODO: finish this
  const get_layout_set = () => {
    const bboxes = [];
    const labels = [];
  
    for (let i = 0; i < layouts.length; i += 1) {
      const layout = layouts[i];
      const bbox = [
        layout.position.x, layout.position.y, layout.position.z,
        layout.size.x, layout.size.y, layout.size.z
      ];
      const label = layout.properties.get('CAT_ID');
      bboxes.push(bbox);
      labels.push(label);
    }
  
    const layout_set_object = {
      bboxes,
      labels,
    };
    return layout_set_object;
  };
  
  const export_layout_set = () => {
    // export the layout set
    sendWebsocketMessage(viser_websocket, { type: 'SaveCheckpointMessage' });
    const layout_set_object = get_layout_set();
    console.log()
  
    const json = JSON.stringify(layout_set_object, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.href = href;
  
    const filname = 'layout_set_json';
    link.download = filname;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const load_layout_set = (layout_set_object) => {
    const { bboxes, labels } = layout_set_object;
  
    for (let i = 0; i < bboxes.length; i += 1) {
      const bbox = bboxes[i];
      const label = labels[i];

      const { size, position } = bbox;
      const category = categories[label];
      setSelectedCategory(category)
      // TODO: support initial values
      add_layout(size, position);
    }
  };

  const uploadLayoutSet = (e) => {
    const fileUpload = e.target.files[0];
  
    const fr = new FileReader();
    fr.onload = (res) => {
      const layout_set_object = JSON.parse(res.target.result);
      load_layout_set(layout_set_object);
    };

    fr.readAsText(fileUpload);
  };

  const open_load_set_modal = () => {
    sendWebsocketMessage(viser_websocket, { type: 'LayoutSetOptionsRequest' });
    setLoadSetModalOpen(true);
  }

  return (
      <div className="LayoutPanel">
        {categories.map((category) => (
          <ClassItem 
            key={category}
            category={category}
            onCategoryClick={handleCategoryClick}
            selected={selectedCategory && selectedCategory === category} />
        ))}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            varient="outlined"
            startIcon={<AddBoxRoundedIcon />}
            onClick={add_layout}
            disabled={!addButtonEnabled}
          >
            {addButtonEnabled ? 'Add layout' : 'Select one'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={export_layout_set}
            disabled={layouts.length === 0}
          >
            Export
          </Button>
          <LoadSetModal
            open={load_set_modal_open}
            setOpen={setLoadSetModalOpen}
            setUploadFunction={uploadLayoutSet}
            loadLayoutSetFunction={load_layout_set}
          />
          <Button
            variant="outlined"
            component="label"
            startIcon={<FileUploadOutlinedIcon />}
            onClick={open_load_set_modal}
          >
            Upload
          </Button>
        </div>
        <div>
          {Object.keys(categoryCounts).length === 0 ? (
            <p style={{ textAlign: 'left', paddingLeft: '10px' }}>
              There is no object in current scene.</p>
          ) : (
            <p style={{ textAlign: 'left', paddingLeft: '10px' }}>
              {'There '}
              {Object.values(categoryCounts).reduce((total, count) => total + count, 0) === 1 ? 'is ' : 'are '}
              {Object.entries(categoryCounts)
                .map(([category, count]) => `${count} \u00d7 ${category}`)
                .join(', ')}
              {' in current scene'}.
            </p>
          )}
        </div>
        <div>
          {layouts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginLeft: '20px', marginRight: '10px' }}>Opacity</Typography>
              <Slider
                value={layouts[0].opacity}
                onChange={handleOpacityChange}
                aria-labelledby="opacity-slider"
                valueLabelDisplay="auto"
                min={0} max={1} step={0.01}
              />
              <Typography style={{ marginLeft: '10px', marginRight: '20px' }}>{layouts[0].opacity.toFixed(1)}</Typography>
            </div>
          )}
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