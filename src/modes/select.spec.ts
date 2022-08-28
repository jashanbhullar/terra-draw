import { Position } from "geojson";
import { GeoJSONStore } from "../store/store";
import { getMockModeConfig } from "../test/mock-config";
import { getDefaultStyling } from "../util/styling";
import { TerraDrawSelectMode } from "./select.mode";

describe("TerraDrawSelectMode", () => {
  let selectMode: TerraDrawSelectMode;
  let store: GeoJSONStore;
  let onChange: jest.Mock;
  let setCursor: jest.Mock;
  let project: jest.Mock;
  let unproject: jest.Mock;
  let onSelect: jest.Mock;
  let onDeselect: jest.Mock;

  const setSelectMode = (
    options?: ConstructorParameters<typeof TerraDrawSelectMode>[0]
  ) => {
    selectMode = new TerraDrawSelectMode(options);

    const mockConfig = getMockModeConfig();
    onChange = mockConfig.onChange;
    project = mockConfig.project;
    unproject = mockConfig.unproject;
    onSelect = mockConfig.onSelect;
    onDeselect = mockConfig.onDeselect;
    setCursor = mockConfig.setCursor;
    store = mockConfig.store;
    selectMode.register(mockConfig);
  };

  const addPolygonToStore = (coords: Position[]) => {
    store.create([
      {
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
        properties: {
          mode: "polygon",
        },
      },
    ]);
  };

  const addLineStringToStore = (coords: Position[]) => {
    store.create([
      {
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
        properties: {
          mode: "linestring",
        },
      },
    ]);
  };

  const addPointToStore = (coords: Position) => {
    store.create([
      {
        geometry: {
          type: "Point",
          coordinates: coords,
        },
        properties: {
          mode: "point",
        },
      },
    ]);
  };

  beforeEach(() => {
    setSelectMode({
      flags: {
        polygon: {
          feature: {},
        },
        linestring: {
          feature: {},
        },
        point: {
          feature: {},
        },
      },
    });
  });

  const mockMouseEventBoundingBox = (
    bbox: [
      [number, number],
      [number, number],
      [number, number],
      [number, number]
    ] = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ]
  ) => {
    unproject
      .mockReturnValueOnce({ lng: bbox[0][0], lat: bbox[0][1] })
      .mockReturnValueOnce({ lng: bbox[1][0], lat: bbox[1][1] })
      .mockReturnValueOnce({ lng: bbox[2][0], lat: bbox[2][1] })
      .mockReturnValueOnce({ lng: bbox[3][0], lat: bbox[3][1] })
      .mockReturnValueOnce({ lng: bbox[0][0], lat: bbox[0][1] });
  };

  describe("constructor", () => {
    it("constructs", () => {
      const selectMode = new TerraDrawSelectMode();
      expect(selectMode.mode).toBe("select");
      expect(selectMode.styling).toStrictEqual(getDefaultStyling());
    });

    it("constructs with options", () => {
      const selectMode = new TerraDrawSelectMode({
        pointerDistance: 40,
        styling: { ...getDefaultStyling(), selectedColor: "#ffffff" },
        keyEvents: {
          deselect: "Backspace",
          delete: "d",
        },
      });

      expect(selectMode.styling).toStrictEqual({
        ...getDefaultStyling(),
        selectedColor: "#ffffff",
      });
    });
  });

  describe("lifecycle", () => {
    it("registers correctly", () => {
      const selectMode = new TerraDrawSelectMode();
      expect(selectMode.state).toBe("unregistered");
      selectMode.register(getMockModeConfig());
      expect(selectMode.state).toBe("registered");
    });

    it("setting state directly throws error", () => {
      const selectMode = new TerraDrawSelectMode();

      expect(() => {
        selectMode.state = "started";
      }).toThrowError();
    });

    it("stopping before not registering throws error", () => {
      const selectMode = new TerraDrawSelectMode();

      expect(() => {
        selectMode.stop();
      }).toThrowError();
    });

    it("starting before not registering throws error", () => {
      const selectMode = new TerraDrawSelectMode();

      expect(() => {
        selectMode.start();
      }).toThrowError();
    });

    it("starting before not registering throws error", () => {
      const selectMode = new TerraDrawSelectMode();

      expect(() => {
        selectMode.start();
      }).toThrowError();
    });

    it("registering multiple times throws an error", () => {
      const selectMode = new TerraDrawSelectMode();

      expect(() => {
        selectMode.register(getMockModeConfig());
        selectMode.register(getMockModeConfig());
      }).toThrowError();
    });

    it("can start correctly", () => {
      const selectMode = new TerraDrawSelectMode();

      selectMode.register(getMockModeConfig());
      selectMode.start();

      expect(selectMode.state).toBe("started");
    });

    it("can stop correctly", () => {
      const selectMode = new TerraDrawSelectMode();

      selectMode.register(getMockModeConfig());
      selectMode.start();
      selectMode.stop();

      expect(selectMode.state).toBe("stopped");
    });
  });

  describe("onClick", () => {
    it("does not select if no features", () => {
      mockMouseEventBoundingBox();

      selectMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
      });

      expect(onChange).not.toBeCalled();
      expect(onDeselect).not.toBeCalled();
      expect(onSelect).not.toBeCalled();
    });

    describe("point", () => {
      it("does select if feature is clicked", () => {
        addPointToStore([0, 0]);
        mockMouseEventBoundingBox([
          [0, 0],
          [0, 1],
          [1, 1],
          [0, 1],
        ]);

        project.mockReturnValueOnce({
          x: 0,
          y: 0,
        });

        selectMode.onClick({
          lng: 0,
          lat: 0,
          containerX: 0,
          containerY: 0,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(1);
      });

      it("does not select if feature is not clicked", () => {
        addPointToStore([0, 0]);
        mockMouseEventBoundingBox([
          [0, 0],
          [0, 1],
          [1, 1],
          [0, 1],
        ]);

        project.mockReturnValueOnce({
          x: 0,
          y: 0,
        });

        selectMode.onClick({
          lng: 50,
          lat: 100,
          containerX: 100,
          containerY: 100,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(0);
      });

      it("does not select if selectable flag is false", () => {
        setSelectMode({ flags: { point: {} } });

        addPointToStore([0, 0]);
        mockMouseEventBoundingBox([
          [0, 0],
          [0, 1],
          [1, 1],
          [0, 1],
        ]);

        project.mockReturnValueOnce({
          x: 0,
          y: 0,
        });

        selectMode.onClick({
          lng: 0,
          lat: 0,
          containerX: 0,
          containerY: 0,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(0);
      });

      it("deselects selected when click is not on same or different feature", () => {
        addPointToStore([0, 0]);

        mockMouseEventBoundingBox();

        project
          .mockReturnValueOnce({
            x: 0,
            y: 0,
          })
          .mockReturnValueOnce({
            x: 0,
            y: 0,
          });

        selectMode.onClick({
          lng: 0,
          lat: 0,
          containerX: 0,
          containerY: 0,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(1);

        mockMouseEventBoundingBox();

        selectMode.onClick({
          lng: 50,
          lat: 50,
          containerX: 50,
          containerY: 50,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(1);
        expect(onDeselect).toBeCalledTimes(1);
      });
    });

    describe("linestring", () => {
      it("does select if feature is clicked", () => {
        addLineStringToStore([
          [0, 0],
          [1, 1],
        ]);

        mockMouseEventBoundingBox([
          [0, 0],
          [0, 1],
          [1, 1],
          [0, 1],
        ]);

        project
          .mockReturnValueOnce({
            x: 0,
            y: 0,
          })
          .mockReturnValueOnce({
            x: 0,
            y: 0,
          });

        selectMode.onClick({
          lng: 0,
          lat: 0,
          containerX: 0,
          containerY: 0,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(1);
      });

      it("does not select if feature is not clicked", () => {
        addLineStringToStore([
          [0, 0],
          [1, 1],
        ]);

        mockMouseEventBoundingBox([
          [0, 0],
          [0, 1],
          [1, 1],
          [0, 1],
        ]);

        project
          .mockReturnValueOnce({
            x: 0,
            y: 0,
          })
          .mockReturnValueOnce({
            x: 0,
            y: 0,
          });

        selectMode.onClick({
          lng: 50,
          lat: 100,
          containerX: 100,
          containerY: 100,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(0);
      });
    });

    describe("polygon", () => {
      it("does select if feature is clicked", () => {
        // Square Polygon
        addPolygonToStore([
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ]);

        mockMouseEventBoundingBox([
          [0, 0],
          [0, 1],
          [1, 1],
          [0, 1],
        ]);

        selectMode.onClick({
          lng: 0.5,
          lat: 0.5,
          containerX: 0,
          containerY: 0,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(1);
      });

      it("does not select if feature is not clicked", () => {
        // Square Polygon
        addPolygonToStore([
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ]);

        mockMouseEventBoundingBox([
          [0, 0],
          [0, 1],
          [1, 1],
          [0, 1],
        ]);

        selectMode.onClick({
          lng: 2,
          lat: 2,
          containerX: 0,
          containerY: 0,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(0);
      });

      it("creates selection points when feature selection flag enabled", () => {
        setSelectMode({
          flags: {
            polygon: {
              feature: {
                coordinates: {
                  draggable: false,
                },
              },
            },
          },
        });

        addPolygonToStore([
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ]);

        expect(onChange).toHaveBeenNthCalledWith(
          1,
          [expect.any(String)],
          "create"
        );

        // Store the ids of the created feature
        const idOne = onChange.mock.calls[0][0] as string[];

        mockMouseEventBoundingBox([
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
        ]);

        // Select polygon
        selectMode.onClick({
          lng: 0.5,
          lat: 0.5,
          containerX: 0,
          containerY: 0,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(1);
        expect(onSelect).toHaveBeenNthCalledWith(1, idOne[0]);

        // Polygon selected set to true
        expect(onChange).toHaveBeenNthCalledWith(2, idOne, "update");

        // Create selection points
        expect(onChange).toHaveBeenNthCalledWith(
          3,
          [
            expect.any(String),
            expect.any(String),
            expect.any(String),
            expect.any(String),
            // We only create 4, not one for the closing coord
            // as it is identical to to the first
          ],
          "create"
        );
      });

      it("creates midpoints when flag enabled", () => {
        setSelectMode({
          flags: {
            polygon: {
              feature: {
                draggable: false,
                coordinates: { draggable: false, midpoints: true },
              },
            },
          },
        });

        addPolygonToStore([
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ]);

        expect(onChange).toHaveBeenNthCalledWith(
          1,
          [expect.any(String)],
          "create"
        );

        // Store the ids of the created feature
        const idOne = onChange.mock.calls[0][0] as string[];

        mockMouseEventBoundingBox([
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
        ]);

        // Select polygon
        selectMode.onClick({
          lng: 0.5,
          lat: 0.5,
          containerX: 0,
          containerY: 0,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(1);
        expect(onSelect).toHaveBeenNthCalledWith(1, idOne[0]);

        // Polygon selected set to true
        expect(onChange).toHaveBeenNthCalledWith(2, idOne, "update");

        // Create selection points
        expect(onChange).toHaveBeenNthCalledWith(
          3,
          [
            expect.any(String),
            expect.any(String),
            expect.any(String),
            expect.any(String),
            // We only create 4, not one for the closing coord
            // as it is identical to to the first
          ],
          "create"
        );

        // Create mid points
        expect(onChange).toHaveBeenNthCalledWith(
          4,
          [
            expect.any(String),
            expect.any(String),
            expect.any(String),
            expect.any(String),
          ],
          "create"
        );
      });

      describe("switch selected", () => {
        it("without selection points flag", () => {
          setSelectMode({
            flags: {
              polygon: { feature: { draggable: false } },
            },
          });

          addPolygonToStore([
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ]);

          expect(onChange).toHaveBeenNthCalledWith(
            1,
            [expect.any(String)],
            "create"
          );

          addPolygonToStore([
            [2, 2],
            [2, 3],
            [3, 3],
            [3, 2],
            [2, 2],
          ]);

          expect(onChange).toHaveBeenNthCalledWith(
            2,
            [expect.any(String)],
            "create"
          );

          // Store the ids of the created features
          const idOne = onChange.mock.calls[0][0] as string[];
          const idTwo = onChange.mock.calls[1][0] as string[];

          mockMouseEventBoundingBox([
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
          ]);

          // Select polygon
          selectMode.onClick({
            lng: 0.5,
            lat: 0.5,
            containerX: 0,
            containerY: 0,
            button: "left",
          });

          expect(onSelect).toBeCalledTimes(1);
          expect(onSelect).toHaveBeenNthCalledWith(1, idOne[0]);

          // First polygon selected set to true
          expect(onChange).toHaveBeenNthCalledWith(3, idOne, "update");

          mockMouseEventBoundingBox([
            [2, 2],
            [2, 3],
            [3, 3],
            [3, 2],
          ]);

          // Deselect first polygon, select second
          selectMode.onClick({
            lng: 2.5,
            lat: 2.5,
            containerX: 0,
            containerY: 0,
            button: "left",
          });

          // Second polygon selected
          expect(onSelect).toBeCalledTimes(2);
          expect(onSelect).toHaveBeenNthCalledWith(2, idTwo[0]);

          // Deselect first polygon
          expect(onDeselect).toBeCalledTimes(1);
          expect(onDeselect).toHaveBeenNthCalledWith(1, idOne[0]);

          // First polygon selected set to false
          expect(onChange).toHaveBeenNthCalledWith(4, idOne, "update");

          // Second polygon selected set to true
          expect(onChange).toHaveBeenNthCalledWith(5, idTwo, "update");
        });

        it("with selection points flag", () => {
          setSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: false,
                  coordinates: { draggable: false },
                },
              },
            },
          });

          addPolygonToStore([
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ]);

          expect(onChange).toHaveBeenNthCalledWith(
            1,
            [expect.any(String)],
            "create"
          );

          addPolygonToStore([
            [2, 2],
            [2, 3],
            [3, 3],
            [3, 2],
            [2, 2],
          ]);

          expect(onChange).toHaveBeenNthCalledWith(
            2,
            [expect.any(String)],
            "create"
          );

          // Store the ids of the created features
          const idOne = onChange.mock.calls[0][0] as string[];
          const idTwo = onChange.mock.calls[1][0] as string[];

          mockMouseEventBoundingBox([
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
          ]);

          // Select polygon
          selectMode.onClick({
            lng: 0.5,
            lat: 0.5,
            containerX: 0,
            containerY: 0,
            button: "left",
          });

          expect(onSelect).toBeCalledTimes(1);
          expect(onSelect).toHaveBeenNthCalledWith(1, idOne[0]);

          // First polygon selected set to true
          expect(onChange).toHaveBeenNthCalledWith(3, idOne, "update");

          // Create selection points
          expect(onChange).toHaveBeenNthCalledWith(
            4,
            [
              expect.any(String),
              expect.any(String),
              expect.any(String),
              expect.any(String),
              // We only create 4, not one for the closing coord
              // as it is identical to to the first
            ],
            "create"
          );

          mockMouseEventBoundingBox([
            [2, 2],
            [2, 3],
            [3, 3],
            [3, 2],
          ]);

          // Deselect first polygon, select second
          selectMode.onClick({
            lng: 2.5,
            lat: 2.5,
            containerX: 0,
            containerY: 0,
            button: "left",
          });

          // Second polygon selected
          expect(onSelect).toBeCalledTimes(2);
          expect(onSelect).toHaveBeenNthCalledWith(2, idTwo[0]);

          // Deselect first polygon selected set to false
          expect(onDeselect).toBeCalledTimes(1);
          expect(onDeselect).toHaveBeenNthCalledWith(1, idOne[0]);

          expect(onChange).toHaveBeenNthCalledWith(5, idOne, "update");

          // Delete first polygon selection points
          expect(onChange).toHaveBeenNthCalledWith(
            6,
            [
              expect.any(String),
              expect.any(String),
              expect.any(String),
              expect.any(String),
              // Again only 4 points as we skip closing coord
            ],
            "delete"
          );

          // Second polygon selected set to true
          expect(onChange).toHaveBeenNthCalledWith(7, idTwo, "update");
        });

        it("with mid points flag", () => {
          setSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: false,
                  coordinates: { draggable: false, midpoints: true },
                },
              },
            },
          });

          addPolygonToStore([
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ]);

          expect(onChange).toHaveBeenNthCalledWith(
            1,
            [expect.any(String)],
            "create"
          );

          addPolygonToStore([
            [2, 2],
            [2, 3],
            [3, 3],
            [3, 2],
            [2, 2],
          ]);

          expect(onChange).toHaveBeenNthCalledWith(
            2,
            [expect.any(String)],
            "create"
          );

          // Store the ids of the created features
          const idOne = onChange.mock.calls[0][0] as string[];
          const idTwo = onChange.mock.calls[1][0] as string[];

          mockMouseEventBoundingBox([
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
          ]);

          // Select polygon
          selectMode.onClick({
            lng: 0.5,
            lat: 0.5,
            containerX: 0,
            containerY: 0,
            button: "left",
          });

          expect(onSelect).toBeCalledTimes(1);
          expect(onSelect).toHaveBeenNthCalledWith(1, idOne[0]);

          // First polygon selected set to true
          expect(onChange).toHaveBeenNthCalledWith(3, idOne, "update");

          // Create selection points
          expect(onChange).toHaveBeenNthCalledWith(
            4,
            [
              expect.any(String),
              expect.any(String),
              expect.any(String),
              expect.any(String),
              // We only create 4, not one for the closing coord
              // as it is identical to to the first
            ],
            "create"
          );

          // Create mid points
          expect(onChange).toHaveBeenNthCalledWith(
            5,
            [
              expect.any(String),
              expect.any(String),
              expect.any(String),
              expect.any(String),
            ],
            "create"
          );

          mockMouseEventBoundingBox([
            [2, 2],
            [2, 3],
            [3, 3],
            [3, 2],
          ]);

          // Mock midpoint distance check
          project
            .mockReturnValueOnce({
              x: 0,
              y: 0,
            })
            .mockReturnValueOnce({
              x: 0,
              y: 0,
            })
            .mockReturnValueOnce({
              x: 0,
              y: 0,
            })
            .mockReturnValueOnce({
              x: 0,
              y: 0,
            });

          // Deselect first polygon, select second
          selectMode.onClick({
            lng: 2.5,
            lat: 2.5,
            containerX: 0,
            containerY: 0,
            button: "left",
          });

          // Second polygon selected
          expect(onSelect).toBeCalledTimes(2);
          expect(onSelect).toHaveBeenNthCalledWith(2, idTwo[0]);

          // Deselect first polygon selected set to false
          expect(onDeselect).toBeCalledTimes(1);
          expect(onDeselect).toHaveBeenNthCalledWith(1, idOne[0]);

          expect(onChange).toHaveBeenNthCalledWith(6, idOne, "update");

          // Delete first polygon selection points
          expect(onChange).toHaveBeenNthCalledWith(
            7,
            [
              expect.any(String),
              expect.any(String),
              expect.any(String),
              expect.any(String),
              // Again only 4 points as we skip closing coord
            ],
            "delete"
          );

          // Delete first polygon mid points
          expect(onChange).toHaveBeenNthCalledWith(
            8,
            [
              expect.any(String),
              expect.any(String),
              expect.any(String),
              expect.any(String),
            ],
            "delete"
          );

          // Second polygon selected set to true
          expect(onChange).toHaveBeenNthCalledWith(9, idTwo, "update");
        });
      });
    });
  });

  describe("onKeyPress", () => {
    describe("Delete", () => {
      it("does nothing with no features selected", () => {
        selectMode.onKeyPress({ key: "Delete" });

        expect(onChange).not.toBeCalled();
        expect(onDeselect).not.toBeCalled();
      });

      it("deletes when feature is selected", () => {
        addPointToStore([0, 0]);

        mockMouseEventBoundingBox();

        project.mockReturnValueOnce({
          x: 0,
          y: 0,
        });

        // Select created feature
        selectMode.onClick({
          lng: 0,
          lat: 0,
          containerX: 0,
          containerY: 0,
          button: "left",
        });

        expect(onChange).toBeCalledTimes(2);
        expect(onChange).toHaveBeenNthCalledWith(
          2,
          [expect.any(String)],
          "update"
        );

        expect(onSelect).toBeCalledTimes(1);

        selectMode.onKeyPress({ key: "Delete" });

        expect(onDeselect).toBeCalledTimes(1);

        expect(onChange).toBeCalledTimes(3);
        expect(onChange).toHaveBeenNthCalledWith(
          3,
          [expect.any(String)],
          "delete"
        );
      });
    });

    describe("Escape", () => {
      it("does nothing with no features selected", () => {
        selectMode.onKeyPress({ key: "Escape" });

        expect(onChange).not.toBeCalled();
        expect(onDeselect).not.toBeCalled();
      });

      it("does nothing with no features selected", () => {
        addPointToStore([0, 0]);

        mockMouseEventBoundingBox();

        project.mockReturnValueOnce({
          x: 0,
          y: 0,
        });

        selectMode.onClick({
          lng: 0,
          lat: 0,
          containerX: 0,
          containerY: 0,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(1);

        selectMode.onKeyPress({ key: "Escape" });

        expect(onChange).toBeCalledTimes(3);
        expect(onDeselect).toBeCalledTimes(1);
      });
    });
  });

  describe("onDragStart", () => {
    it("nothing selected, nothing changes", () => {
      selectMode.onDragStart(
        {
          lng: 0,
          lat: 0,
          containerX: 0,
          containerY: 0,
          button: "left",
        },
        jest.fn()
      );

      expect(onChange).toBeCalledTimes(0);
      expect(onDeselect).toBeCalledTimes(0);
      expect(onSelect).toBeCalledTimes(0);
      expect(project).toBeCalledTimes(0);
    });

    it("does not trigger starting of drag events if mode not draggable", () => {
      addPointToStore([0, 0]);

      mockMouseEventBoundingBox();

      project.mockReturnValueOnce({
        x: 0,
        y: 0,
      });

      selectMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
      });

      expect(onSelect).toBeCalledTimes(1);

      const setMapDraggability = jest.fn();
      selectMode.onDragStart(
        {
          lng: 0,
          lat: 0,
          containerX: 0,
          containerY: 0,
          button: "left",
        },
        setMapDraggability
      );
      expect(setCursor).not.toBeCalled();
      expect(setMapDraggability).not.toBeCalled();
    });

    it("does trigger onDragStart events if mode is draggable", () => {
      selectMode = new TerraDrawSelectMode({
        flags: { point: { feature: { draggable: true } } },
      });

      const mockConfig = getMockModeConfig();
      onChange = mockConfig.onChange;
      project = mockConfig.project;
      unproject = mockConfig.unproject;
      onSelect = mockConfig.onSelect;
      onDeselect = mockConfig.onDeselect;
      setCursor = mockConfig.setCursor;
      store = mockConfig.store;
      selectMode.register(mockConfig);

      addPointToStore([0, 0]);

      mockMouseEventBoundingBox();

      project.mockReturnValueOnce({
        x: 0,
        y: 0,
      });

      selectMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
      });

      expect(onSelect).toBeCalledTimes(1);

      const setMapDraggability = jest.fn();
      selectMode.onDragStart(
        {
          lng: 0,
          lat: 0,
          containerX: 0,
          containerY: 0,
          button: "left",
        },
        setMapDraggability
      );
      expect(setCursor).toBeCalled();
      expect(setMapDraggability).toBeCalled();
    });
  });

  describe("onDrag", () => {
    it("nothing selected, nothing changes", () => {
      selectMode.onDrag({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
      });

      expect(onChange).toBeCalledTimes(0);
      expect(onDeselect).toBeCalledTimes(0);
      expect(onSelect).toBeCalledTimes(0);
      expect(project).toBeCalledTimes(0);
    });

    it("does not trigger drag events if mode not draggable", () => {
      addPointToStore([0, 0]);
      project.mockReturnValueOnce({
        x: 0,
        y: 0,
      });

      mockMouseEventBoundingBox();

      selectMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
      });

      expect(onSelect).toBeCalledTimes(1);
      expect(onChange).toBeCalledTimes(2);

      selectMode.onDrag({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
      });

      expect(onChange).toBeCalledTimes(2);
    });

    describe("drag feature", () => {
      describe("point", () => {
        it("does not trigger dragging updates if dragging flags disabled", () => {
          addPointToStore([0, 0]);

          mockMouseEventBoundingBox();

          project.mockReturnValueOnce({
            x: 0,
            y: 0,
          });

          selectMode.onClick({
            lng: 0,
            lat: 0,
            containerX: 0,
            containerY: 0,
            button: "left",
          });

          expect(onSelect).toBeCalledTimes(1);
          expect(onChange).toBeCalledTimes(2);

          selectMode.onDrag({
            lng: 1,
            lat: 1,
            containerX: 1,
            containerY: 1,
            button: "left",
          });

          expect(onChange).toBeCalledTimes(2);
        });

        it("coordinate draggable flag has no effect for points", () => {
          setSelectMode({
            flags: {
              point: { feature: { coordinates: { draggable: true } } },
            },
          });

          store.create([
            {
              geometry: { type: "Point", coordinates: [0, 0] },
              properties: { mode: "point" },
            },
          ]);

          mockMouseEventBoundingBox();

          project.mockReturnValueOnce({
            x: 0,
            y: 0,
          });

          selectMode.onClick({
            lng: 0,
            lat: 0,
            containerX: 0,
            containerY: 0,
            button: "left",
          });

          expect(onSelect).toBeCalledTimes(1);
          expect(onChange).toBeCalledTimes(2);

          selectMode.onDrag({
            lng: 1,
            lat: 1,
            containerX: 1,
            containerY: 1,
            button: "left",
          });

          expect(onChange).toBeCalledTimes(2);
        });

        it("does trigger drag events if mode is draggable for point", () => {
          setSelectMode({
            flags: {
              point: { feature: { draggable: true } },
            },
          });

          addPointToStore([0, 0]);

          project.mockReturnValueOnce({
            x: 0,
            y: 0,
          });
          mockMouseEventBoundingBox();

          selectMode.onClick({
            lng: 0,
            lat: 0,
            containerX: 0,
            containerY: 0,
            button: "left",
          });

          expect(onSelect).toBeCalledTimes(1);
          expect(onChange).toBeCalledTimes(2);

          project.mockReturnValueOnce({
            x: 0,
            y: 0,
          });
          mockMouseEventBoundingBox();

          selectMode.onDragStart(
            {
              lng: 0,
              lat: 0,
              containerX: 0,
              containerY: 0,
              button: "left",
            },
            jest.fn()
          );

          selectMode.onDrag({
            lng: 1,
            lat: 1,
            containerX: 1,
            containerY: 1,
            button: "left",
          });

          expect(onChange).toBeCalledTimes(3);
        });
      });

      describe("linestring", () => {
        it("does trigger drag events if feature draggable flag set", () => {
          setSelectMode({
            flags: { linestring: { feature: { draggable: true } } },
          });

          addLineStringToStore([
            [0, 0],
            [1, 1],
          ]);

          expect(onChange).toBeCalledTimes(1);
          const idOne = onChange.mock.calls[0][0] as string[];

          mockMouseEventBoundingBox();
          project
            .mockReturnValueOnce({
              x: 0,
              y: 0,
            })
            .mockReturnValueOnce({
              x: 1,
              y: 1,
            });

          selectMode.onClick({
            lng: 0,
            lat: 0,
            containerX: 0,
            containerY: 0,
            button: "left",
          });

          expect(onSelect).toBeCalledTimes(1);
          expect(onChange).toBeCalledTimes(2);

          selectMode.onDragStart(
            {
              lng: 1,
              lat: 1,
              containerX: 1,
              containerY: 1,
              button: "left",
            },
            jest.fn()
          );

          mockMouseEventBoundingBox();

          project
            .mockReturnValueOnce({
              x: 0,
              y: 0,
            })
            .mockReturnValueOnce({
              x: 1,
              y: 1,
            });

          selectMode.onDrag({
            lng: 1,
            lat: 1,
            containerX: 1,
            containerY: 1,
            button: "left",
          });

          expect(onChange).toBeCalledTimes(3);
          expect(onChange).toHaveBeenNthCalledWith(3, idOne, "update");
        });
      });

      describe("polygon", () => {
        it("does trigger drag events if mode is draggable for polygon", () => {
          setSelectMode({
            flags: { polygon: { feature: { draggable: true } } },
          });

          addPolygonToStore([
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ]);

          expect(onChange).toBeCalledTimes(1);

          mockMouseEventBoundingBox();
          project
            .mockReturnValueOnce({
              x: 0,
              y: 0,
            })
            .mockReturnValueOnce({
              x: 1,
              y: 1,
            });

          selectMode.onClick({
            lng: 0,
            lat: 0,
            containerX: 0,
            containerY: 0,
            button: "left",
          });

          expect(onSelect).toBeCalledTimes(1);
          expect(onChange).toBeCalledTimes(2);

          selectMode.onDragStart(
            {
              lng: 1,
              lat: 1,
              containerX: 1,
              containerY: 1,
              button: "left",
            },
            jest.fn()
          );

          mockMouseEventBoundingBox();
          project
            .mockReturnValueOnce({
              x: 0,
              y: 0,
            })
            .mockReturnValueOnce({
              x: 1,
              y: 1,
            });

          selectMode.onDrag({
            lng: 0.5,
            lat: 0.5,
            containerX: 0,
            containerY: 0,
            button: "left",
          });

          expect(onChange).toBeCalledTimes(3);
        });
      });
    });

    describe("drag coordinate", () => {
      it("does trigger drag events if mode is draggable for linestring", () => {
        setSelectMode({
          flags: {
            linestring: { feature: { coordinates: { draggable: true } } },
          },
        });

        // We want to account for ignoring points branch
        addPointToStore([100, 89]);
        expect(onChange).toBeCalledTimes(1);

        addLineStringToStore([
          [0, 0],
          [1, 1],
        ]);
        expect(onChange).toBeCalledTimes(2);

        mockMouseEventBoundingBox();
        project
          .mockReturnValueOnce({
            x: 100,
            y: 100,
          })
          .mockReturnValue({
            x: 0,
            y: 0,
          });

        selectMode.onClick({
          lng: 0,
          lat: 0,
          containerX: 0,
          containerY: 0,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(1);
        expect(onChange).toBeCalledTimes(4);

        // Select feature
        expect(onChange).toHaveBeenNthCalledWith(
          3,
          [expect.any(String)],
          "update"
        );

        // Create selection points
        expect(onChange).toHaveBeenNthCalledWith(
          4,
          [expect.any(String), expect.any(String)],
          "create"
        );

        selectMode.onDragStart(
          {
            lng: 1,
            lat: 1,
            containerX: 1,
            containerY: 1,
            button: "left",
          },
          jest.fn()
        );

        selectMode.onDrag({
          lng: 1,
          lat: 1,
          containerX: 1,
          containerY: 1,
          button: "left",
        });

        expect(onChange).toBeCalledTimes(5);

        // Update linestring position and 1 selection points
        // that gets moved
        expect(onChange).toHaveBeenNthCalledWith(
          5,
          [expect.any(String), expect.any(String)],
          "update"
        );
      });

      it("does trigger drag events if mode is draggable for polygon", () => {
        setSelectMode({
          flags: { polygon: { feature: { coordinates: { draggable: true } } } },
        });

        // We want to account for ignoring points branch
        addPointToStore([100, 89]);

        expect(onChange).toBeCalledTimes(1);

        addPolygonToStore([
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0],
        ]);

        expect(onChange).toBeCalledTimes(2);

        mockMouseEventBoundingBox();

        project
          .mockReturnValueOnce({
            x: 100,
            y: 100,
          })
          .mockReturnValue({
            x: 0,
            y: 0,
          });

        selectMode.onClick({
          lng: 0,
          lat: 0,
          containerX: 0,
          containerY: 0,
          button: "left",
        });

        expect(onSelect).toBeCalledTimes(1);
        expect(onChange).toBeCalledTimes(4);

        // Select feature
        expect(onChange).toHaveBeenNthCalledWith(
          3,
          [expect.any(String)],
          "update"
        );

        // Create selection points
        expect(onChange).toHaveBeenNthCalledWith(
          4,
          [
            expect.any(String),
            expect.any(String),
            expect.any(String),
            expect.any(String),
          ],
          "create"
        );

        selectMode.onDragStart(
          {
            lng: 1,
            lat: 1,
            containerX: 1,
            containerY: 1,
            button: "left",
          },
          jest.fn()
        );

        selectMode.onDrag({
          lng: 1,
          lat: 1,
          containerX: 1,
          containerY: 1,
          button: "left",
        });

        expect(onChange).toBeCalledTimes(5);

        // Update linestring position and 1 selection points
        // that gets moved
        expect(onChange).toHaveBeenNthCalledWith(
          5,
          [expect.any(String), expect.any(String)],
          "update"
        );
      });
    });
  });

  describe("onDragEnd", () => {
    let selectMode: TerraDrawSelectMode;
    let setCursor: jest.Mock;

    beforeEach(() => {
      selectMode = new TerraDrawSelectMode();

      const mockConfig = getMockModeConfig();
      setCursor = mockConfig.setCursor;

      selectMode.register(mockConfig);
    });

    it("sets map draggability back to false, sets cursor to default", () => {
      const setMapDraggability = jest.fn();
      selectMode.onDragEnd(
        { lng: 1, lat: 1, containerX: 1, containerY: 1, button: "left" },
        setMapDraggability
      );

      expect(setMapDraggability).toBeCalledTimes(1);
      expect(setMapDraggability).toBeCalledWith(true);
      expect(setCursor).toBeCalledTimes(1);
      expect(setCursor).toBeCalledWith("grab");
    });
  });

  describe("onMouseMove", () => {
    let selectMode: TerraDrawSelectMode;
    let onChange: jest.Mock;
    let project: jest.Mock;
    let onSelect: jest.Mock;
    let onDeselect: jest.Mock;

    beforeEach(() => {
      selectMode = new TerraDrawSelectMode();

      const mockConfig = getMockModeConfig();
      onChange = mockConfig.onChange;
      project = mockConfig.project;
      onSelect = mockConfig.onSelect;
      onDeselect = mockConfig.onDeselect;

      selectMode.register(mockConfig);
    });

    it("does nothing", () => {
      selectMode.onMouseMove({
        lng: 1,
        lat: 1,
        containerX: 1,
        containerY: 1,
        button: "left",
      });

      expect(onChange).toBeCalledTimes(0);
      expect(onDeselect).toBeCalledTimes(0);
      expect(onSelect).toBeCalledTimes(0);
      expect(project).toBeCalledTimes(0);
    });
  });

  describe("onSelect", () => {
    let selectMode: TerraDrawSelectMode;
    let store: GeoJSONStore;

    beforeEach(() => {
      store = new GeoJSONStore();
      selectMode = new TerraDrawSelectMode();
    });
    it("no op for unregistered onSelect function", () => {
      selectMode.onSelect("test-id");
    });
  });

  describe("onDeselect", () => {
    let selectMode: TerraDrawSelectMode;
    let store: GeoJSONStore;

    beforeEach(() => {
      store = new GeoJSONStore();
      selectMode = new TerraDrawSelectMode();
    });
    it("no op for unregistered onSelect function", () => {
      selectMode.onDeselect("id");
    });
  });
});
