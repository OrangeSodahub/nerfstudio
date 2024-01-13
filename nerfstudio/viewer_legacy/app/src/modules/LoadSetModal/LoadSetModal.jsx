/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';

import { Box, Button, FormControl, Modal, Typography } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { useSelector } from 'react-redux';
import { FileUpload } from '@mui/icons-material';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

interface LoadSetModalProps {
  open: object;
  setOpen: object;
  setUploadFunction: any;
  loadLayoutSetFunction: any;
}

export default function LoadSetModal(props: LoadSetModalProps) {
  const open = props.open;
  const setOpen = props.setOpen;
  const uploadLayoutSet = props.setUploadFunction;
  const loadLayoutSet = props.loadLayoutSetFunction;

  const [existingSetSelect, setExistingSetSelect] = React.useState('');

  // redux store state
  const all_layout_sets = useSelector((state) => state.all_layout_sets);

  let layout_sets_arr = [];
  if (typeof all_layout_sets === 'object' && all_layout_sets !== null) {
    layout_sets_arr = Object.keys(all_layout_sets).map((key) => {
      return {
        name: key,
        val: all_layout_sets[key],
      };
    });
  }

  const hiddenFileInput = React.useRef(null);
  const handleFileUploadClick = () => {
    hiddenFileInput.current.click();
  };

  const hiddenFolderInput = React.useRef(null);
  const handleFolderUploadClick = () => {
    hiddenFolderInput.current.click();
  };

  // react state

  const handleClose = () => setOpen(false);
  const handleSetSelect = (event) => {
    setExistingSetSelect(event.target.value);
  };

  const handleExistingLoadClick = () => {
    loadLayoutSet(existingSetSelect);
    handleClose();
  };

  const handleFileInput = (event) => {
    uploadLayoutSet(event);
    handleClose();
  };

  const handleFolderInput = (event) => {
    uploadLayoutSet(event);
    handleClose();
  };

  return (
    <div className="LoadSetModal">
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title2"
        aria-describedby="modal-modal-description2"
      >
        <Box className="LoadSetModal-box">
          <Typography
            id="modal-modal-description2"
            component="div"
            sx={{ mt: 2 }}
          >
            <div>
              <h2>Load Layout Set</h2>
              {layout_sets_arr.length > 0 && (
                <>
                  <p>
                    Either upload a local file or select a saved Layout Set
                  </p>
                  <FormControl
                    sx={{ minWidth: '100%' }}
                    variant="filled"
                    size="small"
                  >
                    <InputLabel id="ageInputLabel2">Existing Set</InputLabel>
                    <Select
                      labelId="ageInputLabel2"
                      label="Layout Set"
                      value={existingSetSelect}
                      onChange={handleSetSelect}
                    >
                      {layout_sets_arr.map((obj) => {
                        return <MenuItem value={obj.val}>{obj.name}</MenuItem>;
                      })}
                    </Select>
                    <Button
                      sx={{
                        marginTop: '10px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        width: '60%',
                      }}
                      variant="outlined"
                      size="medium"
                      disabled={existingSetSelect === ''}
                      onClick={handleExistingLoadClick}
                    >
                      Load
                    </Button>
                  </FormControl>
                  <br />
                  <center>
                    <p>OR</p>
                  </center>
                </>
              )}
              {layout_sets_arr.length === 0 && (
                <p>No existing saved sets found</p>
              )}
              <div className="LoadSetModal-upload_button">
                <Button
                  sx={{ width: '60%' }}
                  variant="outlined"
                  size="medium"
                  startIcon={<FileUpload />}
                  onClick={handleFileUploadClick}
                >
                  Upload File(s)
                  <input
                    type="file"
                    accept=".json"
                    name="Layout Set File(s)"
                    onChange={handleFileInput}
                    multiple="true"
                    hidden
                    ref={hiddenFileInput}
                  />
                </Button>
              </div>
              <div className="LoadSetModal-upload_button">
                <Button
                  sx={{ width: '60%' }}
                  variant="outlined"
                  size="medium"
                  startIcon={<FileUpload />}
                  onClick={handleFolderUploadClick}
                >
                  Upload Folder
                  <input
                    type="file"
                    name="Layout Set Foler"
                    onChange={handleFolderInput}
                    multiple="true"
                    webkitdirectory="true"
                    hidden
                    ref={hiddenFolderInput}
                  />
                </Button>
              </div>
            </div>
          </Typography>
        </Box>
      </Modal>
    </div>
  );
}
