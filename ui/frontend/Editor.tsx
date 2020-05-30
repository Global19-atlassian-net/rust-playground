import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import * as actions from './actions';
import AdvancedEditor from './AdvancedEditor';
import { CommonEditorProps, Editor as EditorType, Position } from './types';
import { State } from './reducers';

class CodeByteOffsets {
  readonly code: string;
  readonly lines: string[];

  constructor(code: string) {
    this.code = code;
    this.lines = code.split('\n');
  }

  public lineToOffsets(line: number) {
    const precedingBytes = this.bytesBeforeLine(line);

    const highlightedLine = this.lines[line];
    const highlightedBytes = highlightedLine.length;

    return [precedingBytes, precedingBytes + highlightedBytes];
  }

  private bytesBeforeLine(line: number) {
    // Subtract one as this logic is zero-based and the lines are one-based
    line -= 1;

    const precedingLines = this.lines.slice(0, line);

    // Add one to account for the newline we split on and removed
    return precedingLines.map(l => l.length + 1).reduce((a, b) => a + b);
  }
}

class SimpleEditor extends React.PureComponent<CommonEditorProps> {
  private _editor: HTMLTextAreaElement;

  private onChange = e => this.props.onEditCode(e.target.value);
  private trackEditor = component => this._editor = component;
  private onKeyDown = e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      this.props.execute();
    }
  }

  public render() {
    return (
      <textarea
        ref={this.trackEditor}
        className="editor-simple"
        name="editor-simple"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={this.props.code}
        onChange={this.onChange}
        onKeyDown={this.onKeyDown} />
    );
  }

  public componentDidUpdate(prevProps, _prevState) {
    this.gotoPosition(prevProps.position, this.props.position);
  }

  private gotoPosition(oldPosition: Position, newPosition: Position) {
    const editor = this._editor;

    if (!newPosition || !editor) { return; }
    if (newPosition === oldPosition) { return; }

    const offsets = new CodeByteOffsets(this.props.code);
    const [startBytes, endBytes] = offsets.lineToOffsets(newPosition.line);

    editor.setSelectionRange(startBytes, endBytes);
  }
}

const Editor: React.SFC = () => {
  const code = useSelector((state: State) => state.code);
  const editor = useSelector((state: State) => state.configuration.editor);
  const position = useSelector((state: State) => state.position);
  const crates = useSelector((state: State) => state.crates);

  const dispatch = useDispatch();
  const execute = useCallback(() => dispatch(actions.performPrimaryAction()), [dispatch]);
  const onEditCode = useCallback((c) => dispatch(actions.editCode(c)), [dispatch]);

  const SelectedEditor = editor === EditorType.Simple ? SimpleEditor : AdvancedEditor;

  return (
    <div className="editor">
      <SelectedEditor code={code}
        position={position}
        crates={crates}
        onEditCode={onEditCode}
        execute={execute} />
    </div>
  );
};

export default Editor;
