import * as React from 'react';
import * as THREE from 'three';
import { Delete, KeyboardArrowUp, KeyboardArrowDown, ExpandMore, Edit, Visibility, VisibilityOff } from '@mui/icons-material';
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
  const scene_node = props.scene_node;
  const layouts = props.layouts;
  const setLayouts = props.setLayouts;
  const swapLayouts = props.swapLayouts;
  const layoutProperties = props.layoutProperties;
  const setLayoutProperties = props.setLayoutProperties;
  const transform_controls = props.transform_controls;
  const setTransformControls = props.setTransformControls;
  const delete_layout = props.delete_layout;
  const handleSliderMouseDown = props.handleSliderMouseDown;
  const handleSliderMouseUp= props.handleSliderMouseUp;

  const [expanded, setExpanded] = React.useState(null);

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

  const fetchVisbility = (index) => {
    let visible = true;
    scene_node.object.traverse((obj) => {
      if (obj.name === index.toString()) {
        visible = obj.visible;
      }
    });
    return visible;
  }

  const toggleVisbility = (index) => {
    scene_node.object.traverse((obj) => {
      if (obj.name === index.toString()) {
        const visible = obj.visible;
        // eslint-disable-next-line no-param-reassign
        obj.visible = !visible;
      }
    });
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
              setTransformControls(index);
            }}
          >
            <Edit />
          </Button>
          <Stack spacing={0} direction="row" justifyContent="end">
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleVisbility(index);
              }}
              >
              {fetchVisbility(index) ? (<Visibility />) : (<VisibilityOff />)}
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
              value={(layout.size.x / layout.originalSize.x).toFixed(2)}
              onChange={(event, value) => handleSizeChange('x', index, value)}
              onMouseUp={handleSliderMouseUp}
              onMouseDown={handleSliderMouseDown}
              aria-labelledby={`size-x-slider-${index}`}
              valueLabelDisplay="auto"
              min={0.1} max={2} step={0.02}
            />
            <Typography style={{ marginLeft: '10px' }}>{(layout.size.x / layout.originalSize.x).toFixed(1)}</Typography>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography style={{ marginRight: '10px' }}>Scale(Y)</Typography>
            <Slider
              value={(layout.size.y / layout.originalSize.y).toFixed(2)}
              onChange={(event, value) => handleSizeChange('y', index, value)}
              onMouseUp={handleSliderMouseUp}
              onMouseDown={handleSliderMouseDown}
              aria-labelledby={`size-y-slider-${index}`}
              valueLabelDisplay="auto"
              min={0.1} max={2} step={0.02}
            />
            <Typography style={{ marginLeft: '10px' }}>{(layout.size.y / layout.originalSize.y).toFixed(1)}</Typography>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography style={{ marginRight: '10px' }}>Scale(Z)</Typography>
            <Slider
              value={(layout.size.z / layout.originalSize.z).toFixed(2)}
              onChange={(event, value) => handleSizeChange('z', index, value)}
              onMouseUp={handleSliderMouseUp}
              onMouseDown={handleSliderMouseDown}
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
    'wall', 'ceiling', 'floor', 'cabinet', 'bed', 'chair', 'sofa',
    'table', 'door', 'window', 'bookshelf', 'counter', 'desk',
    'curtain', 'refrigerator', 'television', 'whiteboard', 'toilet',
    'sink', 'bathtub', 'doorframe']

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
  const [currentOpacity, setCurrentOpacity] = React.useState(0.6);
  const [sliderChangeState, setSliderChangeState] = React.useState(false);
  const [layoutsAdded, setLayoutsAdded] = React.useState(false);
  const [filesInQueue, setFilesInQueue] = React.useState([]);

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

  const add_layout = () => {
    setCategoryCounts((prevCounts) => ({...prevCounts,
      [selectedCategory]: (prevCounts[selectedCategory] || 0) + 1,
    }));
    const cat_id = categories.findIndex(item => item === selectedCategory.toLowerCase());

    const new_layout = drawLayout(selectedCategory, currentOpacity);
    const new_layout_properties = new Map();
    new_layout.properties = new_layout_properties;
    new_layout_properties.set('NAME', `idx.${id}`);
    new_layout_properties.set('CATEGORY', `${selectedCategory}`)
    new_layout_properties.set('CAT_ID', `${cat_id}`)
    new_layout_properties.set('VISIBLE', true)
    const new_properties = new Map(layoutProperties);
    new_properties.set(new_layout.uuid, new_layout_properties);
    setLayoutProperties(new_properties);
    setLayouts(layouts.concat(new_layout));
    setId(id + 1);
    setLayoutsAdded(true);
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
    setLayoutsAdded(false);
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

  const delete_layout = (index) => {
    // update counts
    setCategoryCounts((prevCounts) => {
      const updatedCounts = { ...prevCounts };
      const categoryToBeDeleted = layouts[index].properties.get('CATEGORY');
      updatedCounts[categoryToBeDeleted] -= 1;
      if (updatedCounts[categoryToBeDeleted] === 0) {
        delete updatedCounts[categoryToBeDeleted];
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
    setLayoutsAdded(false);
  };

  const delete_all_layouts = () => {
    for (let i = 0; i < layouts.length; i += 1) {
      sceneTree.delete(['Layout Set', 'Layouts', i.toString(), 'Layout']);
    }
    setCategoryCounts({});
    setLayouts([]);
    transform_controls.detach();
    const viewer_buttons = document.getElementsByClassName(
      'ViewerWindow-buttons',
    )[0];
    viewer_buttons.style.display = 'none';
    setLayoutsAdded(false);
  };

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

    if (layouts.length > 0 && layoutsAdded && !sliderChangeState) {
      set_transform_controls(layouts.length - 1);
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
    setCurrentOpacity(value);
    setLayoutsAdded(false);
  };

  const handleSliderMouseDown = () => {
    setSliderChangeState(true);
    setLayoutsAdded(false);
  };
  const handleSliderMouseUp = () => {
    setSliderChangeState(false);
    setLayoutsAdded(false);
  };

  const get_layout_set = () => {
    setLayoutsAdded(false);
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
    setLayoutsAdded(false);
    // export the layout set
    sendWebsocketMessage(viser_websocket, { type: 'SaveCheckpointMessage' });
    const layout_set_object = get_layout_set();

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

  const load_layout_set = (layout_set_object, delete_first) => {
    const new_layout_set = delete_first ? [] : layouts;
    const new_properties = delete_first ? new Map() : new Map(layoutProperties);
    let newCategoryCounts = new Map();

    const { bboxes, labels } = layout_set_object;
    
    for (let i = 0; i < bboxes.length; i += 1) {
      const bbox = bboxes[i];
      const label = labels[i];

      const position = new THREE.Vector3(...bbox.slice(0, 3));
      const size = new THREE.Vector3(...bbox.slice(3, 6));
      const category = categories[label];

      newCategoryCounts = {...newCategoryCounts, [category]: (newCategoryCounts[category] || 0) + 1};
      const cat_id = categories.findIndex(item => item === category.toLowerCase());
      const new_layout = drawLayout(category, currentOpacity, size, position);
      const new_layout_properties = new Map();
      const new_id = id + i;
      new_layout.properties = new_layout_properties;
      new_layout_properties.set('NAME', `idx.${new_id}`);
      new_layout_properties.set('CATEGORY', `${category}`)
      new_layout_properties.set('CAT_ID', `${cat_id}`)
      new_layout_properties.set('VISIBLE', true)
      new_properties.set(new_layout.uuid, new_layout_properties);
      new_layout_set.push(new_layout);
    }

    setLayoutProperties(new_properties);
    setLayouts(new_layout_set);
    setCategoryCounts( delete_first ? newCategoryCounts : {...categoryCounts, ...newCategoryCounts});
    setId(id + bboxes.length);
    setLayoutsAdded(false);
  };

  const handleSingleLayoutSet = (file, delete_first = false) => {
    const fr = new FileReader();
    fr.onload = (res) => {
      const layout_set_object = JSON.parse(res.target.result);
      load_layout_set(layout_set_object, delete_first);
    };
    
    fr.readAsText(file);
    setLayoutsAdded(false);
  };

  const uploadLayoutSet = (e) => {
    const files = e.target.files;
    const files_list = [];
    for (let i = 0; i < files.length; i += 1) {
      files_list.push(files[i]);
    }

    setFilesInQueue([...files_list.slice(1)]);
    handleSingleLayoutSet(files_list[0]);
  };

  const handleNextLayoutSet = () => {
    // next layout set
    handleSingleLayoutSet(filesInQueue[0], true);
    setFilesInQueue([...filesInQueue.slice(1)]);
    transform_controls.detach();
    const viewer_buttons = document.getElementsByClassName(
      'ViewerWindow-buttons',
    )[0];
    viewer_buttons.style.display = 'none';
  }

  const open_load_set_modal = () => {
    sendWebsocketMessage(viser_websocket, { type: 'LayoutSetOptionsRequest' });
    setLoadSetModalOpen(true);
    setLayoutsAdded(false);
  };

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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            component="label"
            onClick={delete_all_layouts}
            disabled={layouts.length === 0}
          >
            Delete ALL
          </Button>
          <Button
            variant="outlined"
            component="label"
            onClick={handleNextLayoutSet}
            disabled={filesInQueue.length === 0}
          >
            Next Scene
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
          {filesInQueue.length === 0 ? null : (
            <p style={{ textAlign: 'left', paddingLeft: '10px' }}>
              {`${filesInQueue.length} in queue.`}
            </p>
          )}
        </div>
        <div>
          {layouts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginLeft: '20px', marginRight: '10px' }}>Opacity</Typography>
              <Slider
                value={currentOpacity.toFixed(2)}
                onChange={handleOpacityChange}
                onMouseUp={handleSliderMouseUp}
                onMouseDown={handleSliderMouseDown}
                aria-labelledby="opacity-slider"
                valueLabelDisplay="auto"
                min={0} max={1} step={0.01}
              />
              <Typography style={{ marginLeft: '10px', marginRight: '20px' }}>{currentOpacity.toFixed(1)}</Typography>
            </div>
          )}
        </div>
        <div className="LayoutList-container">
          <LayoutList
            scene_node={sceneTree}
            layouts={layouts}
            setLayouts={setLayouts}
            swapLayouts={swapLayouts}
            layoutProperties={layoutProperties}
            setLayoutProperties={setLayoutProperties}
            transform_controls={transform_controls}
            setTransformControls={set_transform_controls}
            delete_layout={delete_layout}
            handleSliderMouseDown={handleSliderMouseDown}
            handleSliderMouseUp={handleSliderMouseUp}
          />
        </div>
      </div>
  );
}
