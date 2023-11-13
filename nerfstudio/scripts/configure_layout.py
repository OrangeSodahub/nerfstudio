#!/usr/bin/env python
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Literal, Optional

import tyro

from nerfstudio.configs.base_config import LoggingConfig, ViewerConfig
from nerfstudio.utils import writer
from nerfstudio.viewer.server.viewer_state import ViewerState


@dataclass
class ConfigLayout:
    """Config layout."""

    # load_config: Path
    """Path to config YAML file."""
    viewer: ViewerConfig = ViewerConfig()
    """Viewer configuration"""

    def main(self) -> None:
        """Main function."""
        _start_viewer(self.viewer)


def _start_viewer(config: ViewerConfig):
    """Starts the viewer"""

    viewer_log_path = Path(config.relative_log_filename)
    viewer_state = ViewerState(
        config, log_filename=viewer_log_path, datapath=Path('.'))
    banner_messages = [f"Viewer at: {viewer_state.viewer_url}"]

    # We don't need logging, but writer.GLOBAL_BUFFER needs to be populated
    writer.setup_local_writer(LoggingConfig(), max_iter=None, banner_messages=banner_messages)

    viewer_state.init_scene(
        train_dataset=None,
        train_state="completed",
        eval_dataset=None,
    )
    if isinstance(viewer_state, ViewerState):
        viewer_state.viser_server.set_training_state("completed")
    while True:
        time.sleep(0.01)


def entrypoint():
    """Entrypoint for use with pyproject scripts."""
    tyro.extras.set_accent_color("bright_yellow")
    tyro.cli(tyro.conf.FlagConversionOff[ConfigLayout]).main()
    

if __name__ == "__main__":
    entrypoint()


# For sphinx docs
get_parser_fn = lambda: tyro.extras.get_parser(tyro.conf.FlagConversionOff[ConfigLayout])  # noqa