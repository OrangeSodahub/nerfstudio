import * as React from 'react';
import * as THREE from 'three';

import { Button, List } from '@mui/material';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import LevaTheme from '../../../themes/leva_theme.json';

interface ClassItemProps {
  categories: { category: String; color: Number }[];
  onCategoryClick: (category: { category: String; color: Number }) => void;
}

function ClassItems(props: ClassItemProps) {
  const { categories, onCategoryClick } = props;

  return (
    <div>
      {categories.map((category) => (
        <button key={category.category} onClick={() => onCategoryClick(category)}>
          {category.category}
        </button>
      ))}
    </div>
  );
}

interface ClickableListProps {
  sceneTree: object;
}

function ClickableList(props: ClickableListProps) {
  const sceneTree = props.sceneTree;
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  return (
      <ClassItems categories={[
        { category: 'class1', color: 0xff0000 },
        { category: 'class2', color: 0x00ff00 },
        { category: 'class3', color: 0x0000ff },
      ]}
      onCategoryClick={handleCategoryClick}
    />
  )
}

export default function LayoutPanel(props) {
  const sceneTree = props.sceneTree;
  return (
      <div className="LayoutPanel">
        <ClickableList sceneTree={sceneTree} />
      </div>
  );
}