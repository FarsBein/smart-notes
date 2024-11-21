import React from 'react';
import Select, { ActionMeta, InputActionMeta } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import styles from './TagInput.module.scss';

interface Option {
  value: string;
  label: string;
}

interface TagInputProps {
  value: Option[];
  onChange: (value: Option[]) => void;
  options: Option[];
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select or type...'
}) => {
  const handleChange = (
    newValue: unknown,
    actionMeta: ActionMeta<Option>
  ) => {
    onChange(newValue as Option[]);
  };

  return (
    <CreatableSelect
      isMulti
      value={value}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      className={styles.tagInput}
      classNamePrefix="react-select"
      unstyled
      isClearable
      isSearchable
      formatCreateLabel={(inputValue) => `+ ${inputValue}`}
    />
  );
};
